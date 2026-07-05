/** Detect collapsed / stacked node layouts */
export function countOverlappingNodes(nodes, threshold = 36) {
  if (!nodes?.length) return 0;
  let overlaps = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i].position || { x: 0, y: 0 };
      const b = nodes[j].position || { x: 0, y: 0 };
      if (Math.abs(a.x - b.x) < threshold && Math.abs(a.y - b.y) < threshold) {
        overlaps += 1;
      }
    }
  }
  return overlaps;
}

export function hasBrokenLayout(nodes) {
  if (!nodes?.length) return true;
  const atOrigin = nodes.filter((n) => {
    const x = n.position?.x ?? 0;
    const y = n.position?.y ?? 0;
    return x === 0 && y === 0;
  }).length;
  if (atOrigin > 1) return true;
  const overlaps = countOverlappingNodes(nodes);
  return overlaps > Math.max(1, nodes.length * 0.2);
}
