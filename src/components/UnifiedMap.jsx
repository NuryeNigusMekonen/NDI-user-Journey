import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
// Aliased: lucide's Map icon would shadow the global Map constructor used below (new Map()),
// which threw at render and blanked the page.
import { Map as MapIcon, X, AlertTriangle, CheckCircle2, RotateCcw, GitMerge } from 'lucide-react';
import { LANES, NODES, LINKS, PATHS, PATH_FILTERS } from '../data/unifiedMap';

/**
 * One map, every path — the whole platform as a single graph.
 *
 * The six per-stage journeys answer "how does this stage work". This answers "what happens to a
 * census end to end, including when it goes wrong", which is the question a reviewer actually
 * asks. Nodes are laid out on a lane grid rather than by an auto-layout engine: the shape carries
 * meaning (row 0 is the happy-path spine, row 1 is where reality intervenes) and an ELK pass would
 * reorder it into something prettier but less legible.
 */
export default function UnifiedMap() {
  const [path, setPath] = useState(PATHS.ALL);
  const [openId, setOpenId] = useState(null);

  const visible = useMemo(
    () => (path === PATHS.ALL ? NODES : NODES.filter((n) => n.paths.includes(path))),
    [path],
  );
  const visibleIds = useMemo(() => new Set(visible.map((n) => n.id)), [visible]);
  const links = useMemo(
    () => LINKS.filter((l) => (path === PATHS.ALL || l.paths.includes(path))
      && visibleIds.has(l.from) && visibleIds.has(l.to)),
    [path, visibleIds],
  );

  const open = NODES.find((n) => n.id === openId) || null;
  // Count DISTINCT test files: test_engines.py is cited on four nodes, and summing every citation
  // turned a real 166-test suite into a fictional 293.
  const totalTests = useMemo(() => {
    const seen = new Map();
    NODES.forEach((n) => (n.tests || []).forEach((t) => seen.set(t.id, t.n || 0)));
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
          for what it does, the rules it applies, and the tests that prove them.
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
        </div>

        {/* the map */}
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-4 gap-3">
              {LANES.map((lane) => {
                const spine = visible.filter((n) => n.lane === lane.id && n.row === 0);
                const branch = visible.filter((n) => n.lane === lane.id && n.row === 1);
                return (
                  <div key={lane.id}>
                    <p className="text-[9px] font-mono font-semibold tracking-[0.14em] uppercase
                      text-ink-muted/50 mb-2 pb-1.5 border-b border-hairline">
                      {lane.label}
                    </p>
                    <div className="space-y-2">
                      {spine.map((n) => (
                        <NodeCard key={n.id} node={n} active={openId === n.id}
                          onClick={() => setOpenId(openId === n.id ? null : n.id)} />
                      ))}
                    </div>
                    {branch.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dashed border-hairline space-y-2">
                        <p className="text-[9px] font-mono text-amber/70 uppercase tracking-wider">
                          branch
                        </p>
                        {branch.map((n) => (
                          <NodeCard key={n.id} node={n} active={openId === n.id}
                            onClick={() => setOpenId(openId === n.id ? null : n.id)} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* transitions: the links as readable sentences. A hand-drawn SVG of arrows across a
            responsive grid breaks the moment a card wraps; the relationships are the payload, so
            state them in text where they cannot drift out of alignment. */}
        <div className="mt-5">
          <p className="text-[9px] font-mono font-semibold tracking-[0.14em] uppercase text-brand/70 mb-2">
            Transitions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {links.map((l, i) => {
              const from = NODES.find((n) => n.id === l.from);
              const to = NODES.find((n) => n.id === l.to);
              const Icon = l.back ? RotateCcw : l.merge ? GitMerge : null;
              return (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-md border text-[10px] ${
                  l.back ? 'border-amber/25 bg-amber/5'
                    : l.merge ? 'border-teal/25 bg-teal/5'
                      : 'border-hairline bg-surface'}`}>
                  {Icon && <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${l.back ? 'text-amber' : 'text-teal'}`} />}
                  <span className="font-mono text-ink">{from?.title}</span>
                  <span className="text-ink-muted/50">→</span>
                  <span className="font-mono text-ink">{to?.title}</span>
                  {l.label && <span className="text-ink-muted italic ml-auto">{l.label}</span>}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-ink-muted/70 mt-2">
            <RotateCcw className="w-3 h-3 inline text-amber" /> a loop — repeats until clean ·{' '}
            <GitMerge className="w-3 h-3 inline text-teal" /> rejoins the happy path
          </p>
        </div>

        {open && <Detail node={open} onClose={() => setOpenId(null)} />}

        <p className="text-[10px] font-mono text-ink-muted/50 mt-6 pt-4 border-t border-hairline">
          {NODES.length} nodes · {links.length} transitions shown ·{' '}
          {totalTests} backend tests across the cited files (real counts from backend/tests/)
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
      <div className="flex items-center gap-1.5 mt-1.5">
        {node.behavior && (
          <span className="text-[9px] font-mono px-1 rounded bg-hairline/60 text-ink-muted">
            {node.behavior.length} rules
          </span>
        )}
        {n > 0 && (
          <span className="text-[9px] font-mono px-1 rounded bg-teal/15 text-teal">{n} tests</span>
        )}
      </div>
    </button>
  );
}

function Detail({ node, onClose }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mt-5 p-4 rounded-xl bg-surface border border-brand/30">
      <div className="flex items-start gap-3">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-wider text-brand/70">
            {node.kind === 'spine' ? 'Happy path' : 'Branch'} · {node.lane.replace('-', ' ')}
          </p>
          <h3 className="text-[16px] font-bold text-ink mt-0.5">{node.title}</h3>
        </div>
        <button onClick={onClose} className="ml-auto text-ink-muted hover:text-ink">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[12px] text-ink-muted mt-3 leading-relaxed max-w-3xl">{node.what}</p>

      {node.warn && (
        <p className="text-[11px] text-amber mt-3 p-2.5 rounded-lg bg-amber/5 border border-amber/25">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />{node.warn}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-[9px] font-mono font-semibold uppercase tracking-wider text-ink-muted/60 mb-1.5">
            Rules it applies
          </p>
          <ul className="space-y-1">
            {node.behavior.map((b) => (
              <li key={b} className="flex items-start gap-1.5 text-[11px] text-ink">
                <CheckCircle2 className="w-3 h-3 text-teal shrink-0 mt-0.5" />{b}
              </li>
            ))}
          </ul>
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
