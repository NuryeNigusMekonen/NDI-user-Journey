import { EDGE_FLOW } from './diagram';

/** Journey step interaction kinds — maps to Mermaid arrow styles */
export const STEP_KIND = {
  MESSAGE: 'message',
  SYSTEM: 'system',
  HANDOFF: 'handoff',
};

export const STEP_KIND_META = {
  [STEP_KIND.MESSAGE]: {
    label: 'Message',
    editLabel: 'Someone sends a message',
    short: 'MSG',
    description: 'Human or AI communication',
    border: 'border-solid border-[#E8E6DF]',
    bg: 'bg-white',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: 'message',
  },
  [STEP_KIND.SYSTEM]: {
    label: 'Automatic',
    editLabel: 'Happens automatically',
    short: 'SYS',
    description: 'Webhook, automation, background sync',
    border: 'border-dashed border-slate-300',
    bg: 'bg-slate-50',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: 'system',
  },
  [STEP_KIND.HANDOFF]: {
    label: 'Data update',
    editLabel: 'Data is updated',
    short: 'DATA',
    description: 'Cross-system state or pipeline update',
    border: 'border-dashed border-teal-300',
    bg: 'bg-teal-50/50',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: 'handoff',
  },
};

export const FORK_KIND = {
  ALT: 'alt',
  DECISION: 'decision',
};

/** Infer step kind from journey data — explicit kind always wins */
export function inferStepKind(step) {
  if (step?.kind && Object.values(STEP_KIND).includes(step.kind)) {
    return step.kind;
  }
  if (step?.handoff) return STEP_KIND.HANDOFF;
  if (step?.dashed) {
    if (step.to === 'ghl' || step.from === 'ghl') return STEP_KIND.HANDOFF;
    return STEP_KIND.SYSTEM;
  }
  return STEP_KIND.MESSAGE;
}

/** Infer connector flow between journey nodes */
export function inferJourneyEdgeData(sourceNode, targetNode, label = '') {
  const targetKind = targetNode?.data?.kind || inferStepKind(targetNode?.data || {});
  const sourceKind = sourceNode?.data?.kind || inferStepKind(sourceNode?.data || {});

  if (label) {
    return {
      label,
      branch: true,
      journeyBranch: true,
      flowType: EDGE_FLOW.CONDITIONAL,
      journeyFlow: true,
      animated: true,
      branchColor: '#c8102e',
    };
  }

  if (sourceNode?.type === 'fork' || targetNode?.type === 'fork') {
    return {
      label: '',
      branch: false,
      journeyFlow: true,
      flowType: EDGE_FLOW.DEFAULT,
      animated: false,
    };
  }

  if (targetKind === STEP_KIND.SYSTEM || targetKind === STEP_KIND.HANDOFF
    || sourceKind === STEP_KIND.SYSTEM || sourceKind === STEP_KIND.HANDOFF
    || targetNode?.data?.dashed || sourceNode?.data?.dashed) {
    return {
      label: '',
      branch: false,
      journeyFlow: true,
      systemEdge: true,
      flowType: EDGE_FLOW.DATA,
      animated: true,
    };
  }

  return {
    label: '',
    branch: false,
    journeyFlow: true,
    flowType: EDGE_FLOW.DEFAULT,
    animated: false,
  };
}

export function enrichJourneyGraph(nodes, edges) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const enrichedNodes = nodes.map((n) => {
    if (n.type !== 'step') return n;
    const kind = inferStepKind(n.data);
    return { ...n, data: { ...n.data, kind } };
  });

  const enrichedEdges = edges.map((e) => {
    const source = nodeMap.get(e.source);
    const target = nodeMap.get(e.target);
    const label = e.data?.label || e.label || '';
    const inferred = inferJourneyEdgeData(source, target, label);
    return {
      ...e,
      type: 'journey',
      data: { ...e.data, ...inferred, label: label || e.data?.label || '' },
      animated: inferred.animated,
    };
  });

  return { nodes: enrichedNodes, edges: enrichedEdges };
}
