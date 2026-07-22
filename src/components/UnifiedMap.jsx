import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// Aliased: lucide's Map icon would shadow the global Map constructor used below (new Map()),
// which threw at render and blanked the page.
import { Map as MapIcon, X, AlertTriangle, CheckCircle2, RotateCcw, GitMerge,
  Pencil, Save, RotateCcw as Reset, Loader2 } from 'lucide-react';
import { LANES, NODES as GENERATED, LINKS, PATHS, PATH_FILTERS } from '../data/unifiedMap';
import { MapOverlay, applyOverlay } from '../services/MapOverlay';
import { supabase } from '../lib/supabase';

/**
 * One map, every path — the whole platform as a single graph.
 *
 * The six per-stage journeys answer "how does this stage work". This answers "what happens to a
 * census end to end, including when it goes wrong", which is the question a reviewer actually
 * asks. Nodes are laid out on a lane grid rather than by an auto-layout engine: the shape carries
 * meaning (row 0 is the happy-path spine, row 1 is where reality intervenes) and an ELK pass would
 * reorder it into something prettier but less legible.
 */
// Geometry. Rows run cy = -2 (Output C) to +3 (the branch lane), so the canvas must clear six
// bands. ROW_H is deliberately larger than NODE_H: at the old 104 against a 74-tall card, the
// engine fan-out sat ~42px from the branch lane and the cards collided.
const NODE_W = 176;
const NODE_H = 82;
const COL_W = 268;          // horizontal pitch — 92px of gap for the edge labels
const ROW_H = 132;          // vertical pitch for one `cy` unit — 50px of air between cards
const PAD_X = 24;
const PAD_TOP = 42;         // room for the lane headers
const MIN_CY = -2;
const MAX_CY = 3;
const MID_Y = PAD_TOP + NODE_H / 2 + Math.abs(MIN_CY) * ROW_H;   // y of the spine (cy = 0)
const CANVAS_W = PAD_X * 2 + COL_W * 9 + NODE_W;   // 10 columns after the pipeline lane
const CANVAS_H = MID_Y + MAX_CY * ROW_H + NODE_H;

// One absolute point per node, derived from its col/cy. Kept here rather than in the data file:
// these are presentation coordinates, not facts about the platform.
const posFor = (nodes) => Object.fromEntries(nodes.map((n) => [n.id, {
  x: PAD_X + n.col * COL_W + NODE_W / 2,
  y: MID_Y + n.cy * ROW_H,
}]));

const LANE_BOUNDS = [
  { id: 'refdata', label: 'REFERENCE DATA (DE)', x: PAD_X, w: COL_W * 3 - 16 },
  { id: 'upload', label: 'UPLOAD & VALIDATION', x: PAD_X + COL_W * 3, w: COL_W * 2 - 16 },
  { id: 'prep', label: 'DATA PRE-PROCESSING', x: PAD_X + COL_W * 5, w: COL_W - 16 },
  { id: 'engines', label: 'ENGINES', x: PAD_X + COL_W * 6, w: COL_W * 2 - 16 },
  { id: 'outputs', label: 'OUTPUTS', x: PAD_X + COL_W * 8, w: COL_W * 2 - 16 },
];

/** Route a connector between the correct FACES of two cards.
 *
 *  The previous version always left the right edge and entered the left edge, whatever the
 *  geometry. When the target sat below rather than beside, that produced an arrowhead on the
 *  target's LEFT face pointing inward-left (visibly wrong on "Flag & surface defects" and
 *  "Location unresolvable"), and a curve that cut straight through any card in between —
 *  "clean records merge" ran through Normalize + geocode.
 *
 *  Now the exit and entry faces are chosen from the actual offset: mostly-vertical links use the
 *  top/bottom faces, mostly-horizontal ones use the sides, and a link that is both drops out of
 *  the source's bottom, runs along the gap BETWEEN two card rows, then rises into the target's
 *  correct side — so it never crosses a box.
 */
const HALF_W = NODE_W / 2;
const HALF_H = NODE_H / 2;
const HEAD = 10;            // arrowhead length: paths stop this far short so the TIP meets the edge

function pathFor(a, b, l) {
  if (l.back) {                                   // a loop bows below both cards
    const y = Math.max(a.y, b.y) + HALF_H + 26;
    return `M ${a.x} ${a.y + HALF_H} C ${a.x} ${y}, ${b.x} ${y}, ${b.x} ${b.y + HALF_H + HEAD}`;
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const sameCol = Math.abs(dx) < 1;

  // Straight down or up, same column: bottom face to top face.
  if (sameCol) {
    const y1 = dy > 0 ? a.y + HALF_H : a.y - HALF_H;
    const y2 = dy > 0 ? b.y - HALF_H - HEAD : b.y + HALF_H + HEAD;
    return `M ${a.x} ${y1} L ${b.x} ${y2}`;
  }

  // Level with each other. A neighbouring pair goes side to side, but a LONG link on the same row
  // would drive straight through every card between them — "approved rulers" spans four columns
  // and crossed Upload census and Schema validation. Anything beyond one column arcs over the row
  // instead and drops into the target's top face.
  if (Math.abs(dy) < 1) {
    const x1 = dx > 0 ? a.x + HALF_W : a.x - HALF_W;
    const x2 = dx > 0 ? b.x - HALF_W - HEAD : b.x + HALF_W + HEAD;
    if (Math.abs(dx) > COL_W * 1.5) {
      const arc = a.y - ROW_H / 2;                 // the free band above this row
      return `M ${a.x} ${a.y - HALF_H} C ${a.x} ${arc}, ${b.x} ${arc}, ${b.x} ${b.y - HALF_H - HEAD}`;
    }
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${x2} ${b.y}`;
  }

  // Diagonal. Rows are contiguous, so the only card-free horizontal space is the BAND between
  // two rows. Drop out of the source's vertical face into the band immediately beside it, run
  // along that band to the target's column, then turn into the target's near vertical face.
  // Routing to the target's SIDE was what drove connectors through the cards in between.
  const y1 = dy > 0 ? a.y + HALF_H : a.y - HALF_H;
  const band = dy > 0 ? a.y + ROW_H / 2 : a.y - ROW_H / 2;   // the gap next to the source row
  const y2 = dy > 0 ? b.y - HALF_H - HEAD : b.y + HALF_H + HEAD;   // stop short; the head spans the rest
  return `M ${a.x} ${y1} C ${a.x} ${band}, ${b.x} ${band}, ${b.x} ${y2}`;
}

function labelPt(a, b, l) {
  if (l.back) return { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + NODE_H / 2 + 40, anchor: 'middle' };

  const dx = b.x - a.x;
  const dy = b.y - a.y;

  // Same column: beside the vertical run.
  if (Math.abs(dx) < 1) return { x: a.x + HALF_W + 8, y: (a.y + b.y) / 2, anchor: 'start' };

  // Long level link: it arcs over the row, so sit the label on the arc.
  if (Math.abs(dy) < 1 && Math.abs(dx) > COL_W * 1.5) {
    return { x: (a.x + b.x) / 2, y: a.y - ROW_H / 2 - 4, anchor: 'middle' };
  }

  // Short level link: centred in the gap between the two cards.
  if (Math.abs(dy) < 1) {
    const x1 = Math.min(a.x, b.x) + HALF_W;
    const x2 = Math.max(a.x, b.x) - HALF_W;
    return { x: (x1 + x2) / 2, y: a.y - 7, anchor: 'middle' };
  }

  // Diagonal: on the band it travels along, offset from the source so it clears the turn.
  const band = dy > 0 ? a.y + ROW_H / 2 : a.y - ROW_H / 2;
  return { x: (a.x + b.x) / 2, y: band - 5, anchor: 'middle' };
}

export default function UnifiedMap() {
  const [path, setPath] = useState(PATHS.ALL);
  const [openId, setOpenId] = useState(null);

  // Edits live as an overlay over the generated data (see services/MapOverlay): a node nobody
  // touched keeps tracking the repo, and an edited field is marked so a hand-written figure is
  // never mistaken for a generated one.
  const [overlay, setOverlay] = useState(null);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(null);       // pending patches, keyed by node id
  const [saving, setSaving] = useState(false);
  const [who, setWho] = useState('');

  useEffect(() => {
    MapOverlay.load().then((o) => o && setOverlay(o)).catch(() => {});
    supabase.auth.getSession().then(({ data }) => setWho(data?.session?.user?.email || ''));
  }, []);

  const patches = dirty || overlay?.nodes || {};
  const nodes = useMemo(() => applyOverlay(GENERATED, { nodes: patches }), [patches]);
  const POS = useMemo(() => posFor(nodes), [nodes]);

  const patch = (id, field, value) =>
    setDirty((d) => ({ ...(d || overlay?.nodes || {}),
      [id]: { ...((d || overlay?.nodes || {})[id] || {}), [field]: value } }));

  const saveEdits = async () => {
    setSaving(true);
    try {
      const saved = await MapOverlay.save(patches, who);
      setOverlay(saved); setDirty(null); setEditing(false);
    } finally { setSaving(false); }
  };

  const resetNode = (id) => {
    const next = { ...(dirty || overlay?.nodes || {}) };
    delete next[id];
    setDirty(next);
  };

  const visible = useMemo(
    () => (path === PATHS.ALL ? nodes : nodes.filter((n) => n.paths.includes(path))),
    [path, nodes],
  );
  const visibleIds = useMemo(() => new Set(visible.map((n) => n.id)), [visible]);
  const links = useMemo(
    () => LINKS.filter((l) => (path === PATHS.ALL || l.paths.includes(path))
      && visibleIds.has(l.from) && visibleIds.has(l.to)),
    [path, visibleIds],
  );

  const open = nodes.find((n) => n.id === openId) || null;
  // Count DISTINCT test files: test_engines.py is cited on four nodes, and summing every citation
  // turned a real 166-test suite into a fictional 293.
  const totalTests = useMemo(() => {
    const seen = new Map();
    GENERATED.forEach((n) => (n.tests || []).forEach((t) => seen.set(t.id, t.n || 0)));
    return [...seen.values()].reduce((a, b) => a + b, 0);
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <div className="px-4 sm:px-8 py-5 sm:py-7 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-teal/15 border border-teal/40 flex items-center justify-center">
            <MapIcon className="w-[18px] h-[18px] text-teal" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="font-display text-[19px] font-bold text-ink tracking-tight leading-none">
              Nine Tenets platform — full journey
            </h2>
            <p className="text-[10px] font-mono text-ink-muted mt-1.5">
              census in → three-engine cascade → acquisition model
            </p>
          </div>
        </div>
        <p className="text-[12px] text-ink-muted mt-3 max-w-3xl leading-relaxed">
          One map, every path. The <span className="text-teal">teal spine</span> is the happy path;
          branches fork where reality intervenes, run their course, and merge back. Click any node
          for what it does, the rules it applies, and the tests that prove them. Baselined against
          the <span className="font-mono text-ink">version1</span> branch — what staging runs.
        </p>

        {/* focus filter */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-ink-muted/60 mr-1">
            Focus
          </span>
          {PATH_FILTERS.map((f) => (
            <button key={f.id} onClick={() => { setPath(f.id); setOpenId(null); }}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition-colors ${
                path === f.id
                  ? 'border-teal text-teal bg-teal/10 font-semibold'
                  : 'border-hairline text-ink-muted hover:text-ink hover:border-ink-muted/40'
              }`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-1.5">
            {editing ? (
              <>
                <button onClick={saveEdits} disabled={saving || !dirty}
                  className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-md
                    border border-teal/50 text-teal bg-teal/10 hover:bg-teal/20
                    disabled:opacity-40 transition-colors">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  save
                </button>
                <button onClick={() => { setDirty(null); setEditing(false); }}
                  className="text-[10px] font-mono px-2 py-1 rounded-md border border-hairline
                    text-ink-muted hover:text-ink transition-colors">
                  discard
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-md
                  border border-hairline text-ink-muted hover:text-brand hover:border-brand/40
                  transition-colors">
                <Pencil className="w-3 h-3" /> edit map
              </button>
            )}
          </span>
        </div>

        {editing && (
          <p className="text-[10px] text-ink-muted mt-2 p-2 rounded bg-brand/5 border border-brand/20">
            Editing. Click a node to change its title, summary, rules or findings; use the arrows to
            move it. Anything you change is marked <span className="text-amber">edited</span> and
            overrides the generated value — everything you leave alone keeps tracking the repo.
          </p>
        )}

        {/* The drawn map. Fixed canvas coordinates (col/cy on each node) rather than a
            responsive grid: connectors are SVG paths between exact points, so the boxes must not
            reflow underneath them. The canvas scrolls horizontally instead of wrapping. */}
        <div className="mt-5 overflow-x-auto pb-3">
          <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
            {/* lane headers */}
            {LANE_BOUNDS.map((b) => (
              <div key={b.id} className="absolute top-0 text-[9px] font-mono font-semibold
                tracking-[0.14em] uppercase text-ink-muted/45"
                style={{ left: b.x, width: b.w }}>
                <span className="pb-1 border-b border-hairline block">{b.label}</span>
              </div>
            ))}

            {/* connectors, drawn UNDER the cards */}
            <svg className="absolute inset-0 pointer-events-none" width={CANVAS_W} height={CANVAS_H}>
              <defs>
                {/* refX MUST equal the tip's x (10), so the tip sits exactly on the path's end point.
                    It was 7 against a tip at 8, which parked the arrowhead a unit past the line and
                    read as a detached, wrongly-aimed head. markerUnits=userSpaceOnUse keeps the
                    head a fixed size instead of scaling with strokeWidth. */}
                <marker id="ar-teal" viewBox="0 0 10 10" refX="10" refY="5"
                  markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto">
                  <path d="M0,1 L10,5 L0,9 z" className="fill-teal" />
                </marker>
                <marker id="ar-amber" viewBox="0 0 10 10" refX="10" refY="5"
                  markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto">
                  <path d="M0,1 L10,5 L0,9 z" className="fill-amber" />
                </marker>
              </defs>
              {links.map((l, i) => {
                const a = POS[l.from];
                const b = POS[l.to];
                if (!a || !b) return null;
                const amber = l.back || !!nodes.find((n) => n.id === l.to && n.kind === 'branch');
                return (
                  <g key={i}>
                    <path d={pathFor(a, b, l)} fill="none"
                      className={amber ? 'stroke-amber/70' : 'stroke-teal/70'}
                      strokeWidth="1.6"
                      strokeDasharray={l.back || amber ? '5 4' : undefined}
                      markerEnd={`url(#${amber ? 'ar-amber' : 'ar-teal'})`} />
                    {l.label && (() => {
                      // A backing plate behind the text: a label still crosses its own connector,
                      // and unpainted text on a line is unreadable. paint-order draws the stroke
                      // first, so the halo sits UNDER the glyphs rather than over them.
                      const lp = labelPt(a, b, l);
                      return (
                        <text x={lp.x} y={lp.y} textAnchor={lp.anchor}
                          className={`text-[8px] font-mono ${amber ? 'fill-amber' : 'fill-teal'}`}
                          stroke="var(--color-canvas, #fff)" strokeWidth="3"
                          style={{ paintOrder: 'stroke' }}>
                          {l.label}
                        </text>
                      );
                    })()}
                  </g>
                );
              })}
            </svg>

            {/* the cards */}
            {visible.map((n) => (
              <div key={n.id} className="absolute" style={{ left: POS[n.id].x - NODE_W / 2,
                top: POS[n.id].y - NODE_H / 2, width: NODE_W }}>
                <NodeCard node={n} active={openId === n.id}
                  onClick={() => setOpenId(openId === n.id ? null : n.id)} />
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-ink-muted/70 mt-1">
          <strong>Lines:</strong> solid teal = the happy path flowing forward · dashed amber = a
          branch where a rule or a person intervenes · an arrow returning to an earlier node is a
          loop that repeats until clean · a dashed line rejoining the spine is a merge.{' '}
          <strong>Badges:</strong> <span className="text-teal">tested ✓</span> = a manual case
          passed against staging · <span className="text-amber">gap found</span> = manual testing
          found a defect or unbuilt rule, described on the node. Scroll the map sideways.
        </p>

        {open && (
          <Detail node={open} onClose={() => setOpenId(null)} editing={editing}
            onPatch={(f, v) => patch(open.id, f, v)}
            onReset={() => resetNode(open.id)} />
        )}

        <p className="text-[10px] font-mono text-ink-muted/50 mt-6 pt-4 border-t border-hairline">
          {nodes.length} nodes · {links.length} transitions shown · {totalTests} tests across the
          {' '}files cited here, of 239 in the version1 suite (real counts from backend/tests/)
        </p>
      </div>
    </div>
  );
}

function NodeCard({ node, active, onClick }) {
  const n = (node.tests || []).reduce((m, t) => m + (t.n || 0), 0);
  const spine = node.kind === 'spine';
  return (
    <button onClick={onClick}
      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
        active ? 'border-brand bg-brand/10 shadow-sm'
          : spine ? 'border-teal/35 bg-teal/[0.06] hover:border-teal/60'
            : 'border-dashed border-amber/40 bg-amber/[0.05] hover:border-amber/70'}`}>
      <div className="flex items-start gap-1.5">
        <span className="text-[12px] font-semibold text-ink leading-tight">{node.title}</span>
        {node.warn && <AlertTriangle className="w-3 h-3 text-amber shrink-0 mt-0.5" />}
      </div>
      <p className="text-[10px] font-mono text-ink-muted mt-0.5">{node.sub}</p>
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {/* What MANUAL testing found, at a glance: a reader should not have to open a node to see
            that an engine carries a defect. */}
        {node.verdict === 'gap' && (
          <span className="text-[9px] font-mono px-1 rounded bg-amber/20 text-amber font-semibold">
            gap found
          </span>
        )}
        {node.tested && node.verdict !== 'gap' && (
          <span className="text-[9px] font-mono px-1 rounded bg-teal/20 text-teal font-semibold">
            tested ✓
          </span>
        )}
        {node.behavior && (
          <span className="text-[9px] font-mono px-1 rounded bg-hairline/60 text-ink-muted">
            {node.behavior.length} rule{node.behavior.length === 1 ? '' : 's'}
          </span>
        )}
        {n > 0 && (
          <span className="text-[9px] font-mono px-1 rounded bg-teal/15 text-teal">
            {n} test{n === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </button>
  );
}

const EDIT_INPUT = 'w-full px-2 py-1 rounded bg-canvas border border-brand/40 text-[12px] ' +
  'text-ink focus:outline-none focus:border-brand';

function Detail({ node, onClose, editing, onPatch, onReset }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mt-5 p-4 rounded-xl bg-surface border border-brand/30">
      <div className="flex items-start gap-3">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-wider text-brand/70">
            {node.kind === 'spine' ? 'Happy path' : 'Branch'} · {node.lane.replace('-', ' ')}
          </p>
          {editing
            ? <input className={`${EDIT_INPUT} mt-1 font-bold`} value={node.title}
                onChange={(e) => onPatch('title', e.target.value)} />
            : <h3 className="text-[16px] font-bold text-ink mt-0.5">{node.title}</h3>}
          {editing && (
            <input className={`${EDIT_INPUT} mt-1.5 text-[11px]`} value={node.sub || ''}
              placeholder="one-line summary"
              onChange={(e) => onPatch('sub', e.target.value)} />
          )}
        </div>
        {editing && (
          <div className="flex items-center gap-1 ml-auto mr-2">
            <span className="text-[9px] font-mono text-ink-muted/60 mr-1">move</span>
            {[['←', 'col', -1], ['→', 'col', 1], ['↑', 'cy', -1], ['↓', 'cy', 1]].map(([g, f, d]) => (
              <button key={g} title={`move ${g}`}
                onClick={() => onPatch(f, (node[f] ?? 0) + d)}
                className="w-6 h-6 rounded border border-hairline text-ink-muted
                  hover:text-brand hover:border-brand/40 text-[11px] leading-none">
                {g}
              </button>
            ))}
            {node.edited?.length > 0 && (
              <button onClick={onReset} title="Discard this node's edits — back to the generated value"
                className="ml-1 flex items-center gap-1 text-[9px] font-mono px-1.5 py-1 rounded
                  border border-amber/40 text-amber hover:bg-amber/10">
                <Reset className="w-3 h-3" /> reset
              </button>
            )}
          </div>
        )}
        <button onClick={onClose} className="ml-auto text-ink-muted hover:text-ink">
          <X className="w-4 h-4" />
        </button>
      </div>

      {node.edited?.length > 0 && (
        <p className="text-[9px] font-mono text-amber mt-2">
          edited: {node.edited.join(', ')} — these override the generated values
        </p>
      )}

      {editing
        ? <textarea rows={4} className={`${EDIT_INPUT} mt-3`} value={node.what || ''}
            onChange={(e) => onPatch('what', e.target.value)} />
        : <p className="text-[12px] text-ink-muted mt-3 leading-relaxed max-w-3xl">{node.what}</p>}

      {node.warn && (
        <p className="text-[11px] text-amber mt-3 p-2.5 rounded-lg bg-amber/5 border border-amber/25">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />{node.warn}
        </p>
      )}

      {node.tested && (
        <div className={`mt-3 p-3 rounded-lg border ${node.verdict === 'gap'
          ? 'bg-amber/5 border-amber/25' : 'bg-teal/5 border-teal/25'}`}>
          <p className="text-[9px] font-mono font-semibold uppercase tracking-wider mb-1
            text-ink-muted/70">
            What manual testing on staging found
          </p>
          <p className="text-[11px] text-ink leading-relaxed">{node.tested}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-[9px] font-mono font-semibold uppercase tracking-wider text-ink-muted/60 mb-1.5">
            Rules it applies
          </p>
          {editing ? (
            <textarea rows={7} className={`${EDIT_INPUT} text-[11px]`}
              value={(node.behavior || []).join('\n')}
              placeholder="one rule per line"
              onChange={(e) => onPatch('behavior', e.target.value.split('\n').filter(Boolean))} />
          ) : (
          <ul className="space-y-1">
            {node.behavior.map((b) => (
              <li key={b} className="flex items-start gap-1.5 text-[11px] text-ink">
                <CheckCircle2 className="w-3 h-3 text-teal shrink-0 mt-0.5" />{b}
              </li>
            ))}
          </ul>
          )}
          <p className="text-[10px] font-mono text-ink-muted/70 mt-2">
            <span className="text-ink-muted/50">continues → </span>{node.next}
          </p>
        </div>

        <div>
          <p className="text-[9px] font-mono font-semibold uppercase tracking-wider text-ink-muted/60 mb-1.5">
            What proves it
          </p>
          <div className="space-y-1">
            {(node.tests || []).map((t) => (
              <div key={t.id} className="flex items-start gap-2 text-[10px]">
                <span className="font-mono text-teal shrink-0">{t.n}</span>
                <span className="font-mono text-ink shrink-0">{t.id}</span>
                <span className="text-ink-muted">{t.what}</span>
              </div>
            ))}
          </div>
          {node.cases?.length > 0 && (
            <>
              <p className="text-[9px] font-mono font-semibold uppercase tracking-wider text-ink-muted/60 mt-3 mb-1.5">
                Manual cases
              </p>
              <div className="flex flex-wrap gap-1">
                {node.cases.map((c) => (
                  <span key={c} className="text-[9px] font-mono px-1.5 py-0.5 rounded
                    bg-violet/15 text-violet border border-violet/30">{c}</span>
                ))}
              </div>
            </>
          )}
          {node.edges?.length > 0 && (
            <>
              <p className="text-[9px] font-mono font-semibold uppercase tracking-wider text-ink-muted/60 mt-3 mb-1.5">
                Edge cases in the simulated data
              </p>
              <div className="flex flex-wrap gap-1">
                {node.edges.map((e) => (
                  <span key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded
                    bg-brand/10 text-brand border border-brand/30">{e}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
