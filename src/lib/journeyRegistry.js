/** Stable journey identity + board bootstrap helpers */

export function getJourneyId(journey, journeyIndex = 0) {
  return journey?.id || `journey-${journeyIndex}`;
}

export function hasJourneySource(journey) {
  return Array.isArray(journey?.items) && journey.items.length > 0;
}

export async function loadJourneyBoard({
  journey,
  journeyIndex,
  load,
  buildGraph,
  layoutWithElk,
}) {
  const journeyId = getJourneyId(journey, journeyIndex);
  const legacyId = journey?.id ? `journey-${journeyIndex}` : null;
  const saved = await load(journeyId, legacyId);

  const savedComments = saved?.comments || [];
  const savedAnnotations = saved?.annotations || [];
  const meta = {
    boardId: saved?.boardId,
    edgeStyle: saved?.edgeStyle,
    viewport: saved?.viewport,
    mermaidSource: saved?.mermaidSource || null,
    savedBy: saved?.savedBy,
    updatedAt: saved?.updatedAt,
  };

  if (saved?.nodes?.length) {
    return {
      journeyId,
      saved: { ...saved, comments: savedComments, annotations: savedAnnotations },
      source: 'saved',
    };
  }

  if (!hasJourneySource(journey)) {
    return {
      journeyId,
      saved: {
        nodes: [],
        edges: [],
        comments: savedComments,
        annotations: savedAnnotations,
        ...meta,
      },
      source: savedComments.length ? 'saved' : 'empty',
    };
  }

  const graph = buildGraph(journey.items);
  const laid = await layoutWithElk(graph.nodes, graph.edges);
  return {
    journeyId,
    saved: {
      ...meta,
      nodes: laid.nodes,
      edges: laid.edges,
      comments: savedComments,
      annotations: savedAnnotations,
    },
    source: savedComments.length || savedAnnotations.length ? 'saved-overlays' : 'generated',
  };
}
