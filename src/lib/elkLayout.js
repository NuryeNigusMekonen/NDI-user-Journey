let elk;

async function getElk() {
  if (!elk) {
    const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
    elk = new ELK();
  }
  return elk;
}

export async function layoutWithElk(nodes, edges) {
  const layoutEngine = await getElk();
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '56',
      'elk.layered.spacing.nodeNodeBetweenLayers': '110',
      'elk.layered.spacing.edgeNodeBetweenLayers': '48',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.padding': '[top=40,left=40,bottom=40,right=40]',
    },
    children: nodes.map((n) => ({
      id: n.id,
      width: n.width,
      height: n.height,
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
