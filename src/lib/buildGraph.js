import { inferStepKind, inferJourneyEdgeData } from '../types/journeySemantics';
import { resolveEdgeHandles } from '../services/FlowInference';

const NODE_W = 228;
const STEP_H = 96;
const NOTE_H = 64;
const BANNER_H = 52;

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
          height: STEP_H,
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
        const h = item.anchor ? NOTE_H : BANNER_H;
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
