const NODE_W = 228;
const STEP_H = 88;
const NOTE_H = 64;
const BANNER_H = 52;

export function buildGraph(items) {
  const nodes = [];
  const edges = [];
  let counter = 0;
  const nid = () => `n${counter++}`;
  const eid = () => `e${counter++}`;
  let stepNum = 0;

  function walk(seq, preds) {
    let front = preds;
    for (const item of seq) {
      if (item.type === 'branch-group') continue;
      if (item.type === 'step') {
        stepNum += 1;
        const id = nid();
        nodes.push({
          id,
          type: 'step',
          data: { ...item, stepNum },
          width: NODE_W,
          height: STEP_H,
        });
        for (const p of front) {
          if (p.id) {
            edges.push({
              id: eid(),
              source: p.id,
              target: id,
              label: p.label || '',
              type: 'journey',
              data: { branch: !!p.label, label: p.label || '' },
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
            edges.push({
              id: eid(),
              source: p.id,
              target: id,
              type: 'journey',
              data: { branch: false },
            });
          }
        }
        front = [{ id }];
      } else if (item.type === 'alt') {
        const forkId = nid();
        nodes.push({
          id: forkId,
          type: 'fork',
          data: {},
          width: 72,
          height: 72,
        });
        for (const p of front) {
          if (p.id) {
            edges.push({
              id: eid(),
              source: p.id,
              target: forkId,
              type: 'journey',
              data: { branch: false },
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
