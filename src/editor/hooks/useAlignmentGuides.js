const SNAP = 6;

function getNodeBounds(node) {
  const w = node.measured?.width || node.width || node.style?.width || 200;
  const h = node.measured?.height || node.height || node.style?.height || 80;
  const x = node.position.x;
  const y = node.position.y;
  return {
    left: x,
    right: x + w,
    top: y,
    bottom: y + h,
    centerX: x + w / 2,
    centerY: y + h / 2,
    width: w,
    height: h,
  };
}

export function computeAlignmentGuides(movingNode, allNodes, threshold = SNAP) {
  if (!movingNode) return { guides: [], snapX: null, snapY: null };

  const moving = getNodeBounds(movingNode);
  const guides = [];
  let snapX = null;
  let snapY = null;
  let bestDx = threshold + 1;
  let bestDy = threshold + 1;

  const others = allNodes.filter((n) => n.id !== movingNode.id && !n.data?.locked);

  for (const other of others) {
    const b = getNodeBounds(other);

    const xPairs = [
      { a: moving.left, b: b.left, guide: b.left },
      { a: moving.right, b: b.right, guide: b.right },
      { a: moving.centerX, b: b.centerX, guide: b.centerX },
      { a: moving.left, b: b.right, guide: b.right },
      { a: moving.right, b: b.left, guide: b.left },
    ];

    for (const { a, b: bv, guide } of xPairs) {
      const d = Math.abs(a - bv);
      if (d < threshold && d < bestDx) {
        bestDx = d;
        snapX = moving.position.x + (bv - a);
        guides.push({ type: 'v', pos: guide, from: Math.min(moving.top, b.top) - 20, to: Math.max(moving.bottom, b.bottom) + 20 });
      }
    }

    const yPairs = [
      { a: moving.top, b: b.top, guide: b.top },
      { a: moving.bottom, b: b.bottom, guide: b.bottom },
      { a: moving.centerY, b: b.centerY, guide: b.centerY },
      { a: moving.top, b: b.bottom, guide: b.bottom },
      { a: moving.bottom, b: b.top, guide: b.top },
    ];

    for (const { a, b: bv, guide } of yPairs) {
      const d = Math.abs(a - bv);
      if (d < threshold && d < bestDy) {
        bestDy = d;
        snapY = moving.position.y + (bv - a);
        guides.push({ type: 'h', pos: guide, from: Math.min(moving.left, b.left) - 20, to: Math.max(moving.right, b.right) + 20 });
      }
    }
  }

  const unique = [];
  const seen = new Set();
  for (const g of guides) {
    const key = `${g.type}-${g.pos}`;
    if (!seen.has(key)) { seen.add(key); unique.push(g); }
  }

  return { guides: unique, snapX, snapY };
}
