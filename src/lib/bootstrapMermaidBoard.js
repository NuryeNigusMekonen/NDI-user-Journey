import { importMermaidToReactFlow } from './mermaidImport';
import {
  getDefaultMermaidForJourney,
  shouldBootstrapMermaidFlowchart,
} from './journeyItemsToMermaid';

/**
 * Resolve board diagram: Mermaid flowchart for every journey page.
 * - Valid saved board → keep user positions (no forced re-layout)
 * - Broken / legacy swimlane / wrong direction → regenerate from journey template
 */
export async function resolveMermaidBoard(journey, saved, edgeStyle = 'smoothstep') {
  const base = {
    nodes: saved?.nodes || [],
    edges: saved?.edges || [],
    mermaidSource: saved?.mermaidSource || null,
  };

  const mustRegenerate = shouldBootstrapMermaidFlowchart(saved, journey);

  if (!mustRegenerate && saved?.nodes?.length) {
    return {
      nodes: saved.nodes,
      edges: saved.edges || [],
      mermaidSource: saved.mermaidSource || null,
      bootstrapped: false,
    };
  }

  const defaultCode = getDefaultMermaidForJourney(journey);
  if (!defaultCode) return { ...base, bootstrapped: false };

  const result = await importMermaidToReactFlow(defaultCode, edgeStyle);
  if (!result.ok) {
    console.warn('[bootstrapMermaid]', journey?.id, result.errors);
    return { ...base, bootstrapped: false };
  }

  return {
    nodes: result.nodes,
    edges: result.edges,
    mermaidSource: result.mermaidSource,
    bootstrapped: true,
  };
}
