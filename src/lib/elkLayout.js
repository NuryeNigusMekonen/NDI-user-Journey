let elk;

async function getElk() {
  if (!elk) {
    const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
    elk = new ELK();
  }
  return elk;
}

export async function layoutWithElk(nodes, edges, direction = 'right', options = {}) {
  const layoutEngine = await getElk();
  const dirMap = { right: 'RIGHT', left: 'LEFT', down: 'DOWN', up: 'UP' };
  const vertical = direction === 'down' || direction === 'up';
  const flowchart = options.flowchart === true;

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': dirMap[direction] || 'DOWN',
      // Vertical journeys are long (~20 steps), so keep the step-to-step gap tight — the eye
      // follows a close column far better than a sparse one, and it halves the scrolling.
      'elk.spacing.nodeNode': flowchart ? (vertical ? '44' : '64') : (vertical ? '28' : '56'),
      'elk.layered.spacing.nodeNodeBetweenLayers': flowchart ? (vertical ? '88' : '120') : (vertical ? '40' : '110'),
      'elk.layered.spacing.edgeNodeBetweenLayers': flowchart ? (vertical ? '44' : '56') : (vertical ? '24' : '48'),
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.edgeRouting': flowchart ? 'SPLINES' : 'ORTHOGONAL',
      'elk.padding': flowchart ? '[top=48,left=56,bottom=48,right=56]' : '[top=40,left=40,bottom=40,right=40]',
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: n.width || n.style?.width || 200,
      height: n.height || n.style?.height || 80,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
      labels: e.data?.label
        ? [{ text: e.data.label, width: Math.min(e.data.label.length * 6.5 + 16, 200), height: 22 }]
        : [],
    })),
  };

  const layout = await layoutEngine.layout(graph);

  const laidNodes = nodes.map((node) => {
    const l = layout.children?.find((c) => c.id === node.id);
    return {
      ...node,
      position: { x: l?.x ?? 0, y: l?.y ?? 0 },
      style: { width: node.width, height: node.height },
    };
  });

  return { nodes: laidNodes, edges };
}
