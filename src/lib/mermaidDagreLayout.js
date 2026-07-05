import { layout as dagreLayout } from 'dagre-d3-es/src/dagre/layout.js';
import { Graph } from 'dagre-d3-es/src/graphlib/index.js';

const RANKDIR = { down: 'TB', up: 'BT', right: 'LR', left: 'RL' };

/** Dagre layout — same engine Mermaid v11 uses for flowcharts */
export function layoutWithDagre(nodes, edges, direction = 'down', config = {}) {
  const horizontal = direction === 'right' || direction === 'left';
  const g = new Graph({ multigraph: true, compound: false }).setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: RANKDIR[direction] || 'TB',
    ranker: 'network-simplex',
    align: undefined,
    nodesep: config.nodeSpacing ?? (horizontal ? 56 : 44),
    ranksep: config.rankSpacing ?? (horizontal ? 100 : 88),
    edgesep: 20,
    marginx: 24,
    marginy: 24,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: Math.max(node.width || node.style?.width || 160, 96),
      height: Math.max(node.height || node.style?.height || 56, 44),
    });
  });

  edges.forEach((edge, i) => {
    const label = edge.data?.label || '';
    g.setEdge(
      { v: edge.source, w: edge.target, name: edge.id || `e${i}` },
      {
        label,
        width: label ? Math.min(label.length * 7 + 12, 80) : 0,
        height: label ? 18 : 0,
      },
    );
  });

  dagreLayout(g);

  const laidNodes = nodes.map((node) => {
    const n = g.node(node.id);
    const w = n?.width ?? node.width ?? 160;
    const h = n?.height ?? node.height ?? 56;
    return {
      ...node,
      width: w,
      height: h,
      style: { width: w, height: h },
      position: {
        x: (n?.x ?? 0) - w / 2,
        y: (n?.y ?? 0) - h / 2,
      },
    };
  });

  return { nodes: laidNodes, edges };
}

/** Shift graph so top-left starts near origin with padding */
export function normalizeOrigin(nodes, padding = 32) {
  if (!nodes.length) return nodes;
  const xs = nodes.map((n) => n.position?.x ?? 0);
  const ys = nodes.map((n) => n.position?.y ?? 0);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const dx = padding - minX;
  const dy = padding - minY;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return nodes;
  return nodes.map((n) => ({
    ...n,
    position: {
      x: (n.position?.x ?? 0) + dx,
      y: (n.position?.y ?? 0) + dy,
    },
  }));
}
