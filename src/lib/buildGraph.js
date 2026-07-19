import { inferStepKind, inferJourneyEdgeData } from '../types/journeySemantics';
import { resolveEdgeHandles } from '../services/FlowInference';

const NODE_W = 228;
const STEP_H = 96;
const NOTE_H = 64;
const BANNER_H = 52;

// Text-wrapping height estimate. ELK spaces nodes using the height we DECLARE, but a note renders
// its full wrapped text — declaring a flat 64px for a 250-character note made the node draw ~3x
// taller than its reserved slot and overlap the next step. Estimate from the content instead.
const CHARS_PER_LINE = 30;        // ~228px wide at the note's font size, minus padding
const LINE_H = 17;                // rendered line-height
const V_PADDING = 26;             // top+bottom padding inside the card

function textHeight(text, min) {
  const raw = String(text || '');
  if (!raw) return min;
  // Count wrapped lines per explicit line break, so a hard-wrapped note is measured faithfully.
  const lines = raw.split('\n')
    .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0);
  return Math.max(min, Math.round(lines * LINE_H + V_PADDING));
}

export function buildGraph(items) {
  const nodes = [];
  const edges = [];
  let counter = 0;
  const nid = () => `n${counter++}`;
  const eid = () => `e${counter++}`;
  let stepNum = 0;
  let forkNum = 0;

  function walk(seq, preds) {
    let front = preds;
    for (const item of seq) {
      if (item.type === 'branch-group') continue;
      if (item.type === 'step') {
        stepNum += 1;
        const id = nid();
        const kind = inferStepKind(item);
        nodes.push({
          id,
          type: 'step',
          data: { ...item, stepNum, kind },
          width: NODE_W,
          // Steps wrap too — a 100-character step needs ~4 lines, more than the flat STEP_H.
          // +18 leaves room for the step number/actor line above the text.
          height: textHeight(item.text, STEP_H) + 18,
        });
        for (const p of front) {
          if (p.id) {
            const source = nodes.find((n) => n.id === p.id);
            const target = nodes.find((n) => n.id === id);
            const edgeData = inferJourneyEdgeData(source, target, p.label || '');
            const handles = resolveEdgeHandles(source, target);
            edges.push({
              id: eid(),
              source: p.id,
              target: id,
              label: p.label || '',
              type: 'journey',
              animated: edgeData.animated,
              data: edgeData,
              ...handles,
            });
          }
        }
        front = [{ id }];
      } else if (item.type === 'note') {
        const id = nid();
        const h = textHeight(item.text, item.anchor ? NOTE_H : BANNER_H);
        nodes.push({
          id,
          type: 'note',
          data: item,
          width: NODE_W,
          height: h,
        });
        for (const p of front) {
          if (p.id) {
            const source = nodes.find((n) => n.id === p.id);
            const target = nodes.find((n) => n.id === id);
            const edgeData = inferJourneyEdgeData(source, target, '');
            edges.push({
              id: eid(),
              source: p.id,
              target: id,
              type: 'journey',
              data: edgeData,
              ...resolveEdgeHandles(source, target),
            });
          }
        }
        front = [{ id }];
      } else if (item.type === 'alt') {
        forkNum += 1;
        const forkId = nid();
        const branchLabels = item.branches.map((b) => b.label).filter(Boolean);
        const forkTitle = branchLabels[0] || `Alt ${forkNum}`;
        nodes.push({
          id: forkId,
          type: 'fork',
          data: { title: forkTitle, kind: 'alt', forkNum },
          width: 140,
          height: 160,
        });
        for (const p of front) {
          if (p.id) {
            const source = nodes.find((n) => n.id === p.id);
            const target = nodes.find((n) => n.id === forkId);
            const edgeData = inferJourneyEdgeData(source, target, '');
            edges.push({
              id: eid(),
              source: p.id,
              target: forkId,
              type: 'journey',
              data: edgeData,
              ...resolveEdgeHandles(source, target),
            });
          }
        }
        const next = [];
        for (const b of item.branches) {
          const ends = walk(b.steps, [{ id: forkId, label: b.label }]);
          next.push(...ends);
        }
        if (next.length) front = next;
      }
    }
    return front;
  }

  walk(items, [{ id: null }]);
  return { nodes, edges };
}

export { NODE_W };
