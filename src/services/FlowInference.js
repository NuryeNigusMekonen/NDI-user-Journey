import { NODE_TYPES, EDGE_FLOW } from '../types/diagram';

const JOURNEY_TYPES = new Set([NODE_TYPES.STEP, NODE_TYPES.NOTE, NODE_TYPES.FORK]);

export const BRANCH_HANDLES = {
  'branch-right': 0,
  'branch-bottom': 1,
  'branch-left': 2,
  'branch-top': 3,
};

export const BRANCH_COLORS = ['#1F4E79', '#d97706', '#7c3aed', '#059669'];

export const FLOW_GUIDE = {
  default: 'Standard flow — single path between actions, screens, or steps.',
  conditional: 'Branch path — always used from Decision nodes. Label each path (optional).',
  data: 'Data transfer — system handoffs via Input/Output nodes.',
  journey: 'Lifecycle branch — from Fork nodes between journey steps.',
};

export function isJourneyNode(node) {
  return node && JOURNEY_TYPES.has(node.type);
}

export function isBranchNode(node) {
  return node?.type === NODE_TYPES.DECISION || node?.type === NODE_TYPES.FORK;
}

export function isDecisionNode(node) {
  return node?.type === NODE_TYPES.DECISION;
}

export function isForkNode(node) {
  return node?.type === NODE_TYPES.FORK;
}

export function isActionNode(node) {
  return node?.type === NODE_TYPES.ACTION || node?.type === NODE_TYPES.PROCESS;
}

export function isStepNode(node) {
  return node?.type === NODE_TYPES.STEP;
}

/** Pick side handles for journey nodes — steps always connect left/right, never top */
export function resolveEdgeHandles(source, target, { sourceX, targetX } = {}) {
  if (!source || !target) return {};

  const sx = sourceX ?? source.position?.x ?? 0;
  const tx = targetX ?? target.position?.x ?? 0;
  const forward = sx <= tx;

  if (isStepNode(source) && isStepNode(target)) {
    return forward
      ? { sourceHandle: 'right-out', targetHandle: 'left-in' }
      : { sourceHandle: 'left-out', targetHandle: 'right-in' };
  }

  if (isStepNode(source) && isForkNode(target)) {
    return { sourceHandle: forward ? 'right-out' : 'left-out', targetHandle: 'in' };
  }

  if (isForkNode(source) && isStepNode(target)) {
    return { sourceHandle: 'branch-right', targetHandle: forward ? 'left-in' : 'right-in' };
  }

  if (isStepNode(source) && target?.type === NODE_TYPES.NOTE) {
    return forward
      ? { sourceHandle: 'right-out', targetHandle: 'left-in' }
      : { sourceHandle: 'left-out', targetHandle: 'right-in' };
  }

  if (source?.type === NODE_TYPES.NOTE && isStepNode(target)) {
    return forward
      ? { sourceHandle: 'right-out', targetHandle: 'left-in' }
      : { sourceHandle: 'left-out', targetHandle: 'right-in' };
  }

  return {};
}

function edgeHandlesLocked(edge) {
  return !!(edge.data?.handlesPinned || (edge.sourceHandle && edge.targetHandle));
}

/** Re-apply side handles after layout or when loading saved boards */
export function normalizeJourneyEdgeHandles(nodes, edges, { preserveSaved = false } = {}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((edge) => {
    if (preserveSaved && edgeHandlesLocked(edge)) {
      return edge;
    }
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    const handles = resolveEdgeHandles(source, target);
    if (!handles.sourceHandle) return edge;
    return { ...edge, ...handles };
  });
}

function nodeCenter(node) {
  const w = node?.width || node?.style?.width || 200;
  const h = node?.height || node?.style?.height || 80;
  return {
    x: (node?.position?.x || 0) + w / 2,
    y: (node?.position?.y || 0) + h / 2,
  };
}

const BRANCH_BY_LAYOUT = {
  down: ['branch-bottom', 'branch-right', 'branch-left'],
  up: ['branch-top', 'branch-left', 'branch-right'],
  right: ['branch-right', 'branch-bottom', 'branch-left'],
  left: ['branch-left', 'branch-bottom', 'branch-right'],
};

/** Top-down / flowchart port routing — Mermaid TD style */
export function resolveFlowchartEdgeHandles(source, target, { layout = 'down' } = {}) {
  if (!source || !target) return {};

  const s = nodeCenter(source);
  const t = nodeCenter(target);
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const vertical = layout === 'down' || layout === 'up';
  const primaryVertical = vertical && Math.abs(dy) >= Math.abs(dx) * 0.55;

  let sourceHandle;
  let targetHandle;

  if (primaryVertical) {
    sourceHandle = dy >= 0 ? 'bottom-out' : 'top-out';
    targetHandle = dy >= 0 ? 'top-in' : 'bottom-in';
  } else {
    sourceHandle = dx >= 0 ? 'right-out' : 'left-out';
    targetHandle = dx >= 0 ? 'left-in' : 'right-in';
  }

  if (isDecisionNode(target) || isForkNode(target)) {
    targetHandle = 'in';
  }

  return { sourceHandle, targetHandle };
}

function branchHandleForDecision(source, target, layout, branchIndex) {
  const order = BRANCH_BY_LAYOUT[layout] || BRANCH_BY_LAYOUT.down;
  const s = nodeCenter(source);
  const t = nodeCenter(target);
  const dx = t.x - s.x;
  const dy = t.y - s.y;

  if (Math.abs(dy) >= Math.abs(dx)) {
    if (dy > 0 && branchIndex === 0) return 'branch-bottom';
    if (dy <= 0 && branchIndex === 0) return 'branch-top';
    return dx >= 0 ? 'branch-right' : 'branch-left';
  }

  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx > 0 && branchIndex === 0) return 'branch-right';
    if (dx <= 0 && branchIndex === 0) return 'branch-left';
    return dy >= 0 ? 'branch-bottom' : 'branch-top';
  }

  return order[branchIndex % order.length];
}

/** Re-apply TD/LR handles after ELK layout — journey pairs keep horizontal handles */
export function normalizeFlowchartEdgeHandles(nodes, edges, layout = 'down', { preserveSaved = false } = {}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const bySource = new Map();

  edges.forEach((edge) => {
    const source = byId.get(edge.source);
    if (!source || isJourneyNode(source)) return;
    if (!bySource.has(edge.source)) bySource.set(edge.source, []);
    bySource.get(edge.source).push(edge);
  });

  bySource.forEach((group, sourceId) => {
    const source = byId.get(sourceId);
    if (!isBranchNode(source)) return;
    group.sort((a, b) => {
      const ta = byId.get(a.target);
      const tb = byId.get(b.target);
      const s = nodeCenter(source);
      const ca = nodeCenter(ta);
      const cb = nodeCenter(tb);
      const angA = Math.atan2(ca.y - s.y, ca.x - s.x);
      const angB = Math.atan2(cb.y - s.y, cb.x - s.x);
      return angA - angB;
    });
  });

  return edges.map((edge) => {
    if (preserveSaved && edgeHandlesLocked(edge)) {
      return edge;
    }

    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return edge;

    if (isJourneyNode(source) || isJourneyNode(target)) {
      const handles = resolveEdgeHandles(source, target);
      return handles.sourceHandle ? { ...edge, ...handles } : edge;
    }

    if (isBranchNode(source)) {
      const siblings = bySource.get(edge.source) || [edge];
      const branchIndex = siblings.indexOf(edge);
      const sourceHandle = branchHandleForDecision(source, target, layout, branchIndex);
      const targetHandles = resolveFlowchartEdgeHandles(source, target, { layout });
      return { ...edge, sourceHandle, targetHandle: targetHandles.targetHandle };
    }

    return { ...edge, ...resolveFlowchartEdgeHandles(source, target, { layout }) };
  });
}

function isFlowchartBoard(nodes) {
  return nodes.some((n) => n.data?.flowchart || n.data?.mermaidId || n.id?.startsWith('mmd-'));
}

/** Use saved connector ports as-is — only infer handles for freshly generated boards */
export function prepareLoadedEdges(edges, edgeStyle = 'smoothstep') {
  return (edges || []).map((edge) => {
    const sourceHandle = edge.sourceHandle ?? edge.data?.sourceHandle ?? null;
    const targetHandle = edge.targetHandle ?? edge.data?.targetHandle ?? null;
    return {
      ...edge,
      type: edge.type || edgeStyle,
      ...(sourceHandle ? { sourceHandle } : {}),
      ...(targetHandle ? { targetHandle } : {}),
      data: {
        ...(edge.data || {}),
        ...(sourceHandle ? { sourceHandle } : {}),
        ...(targetHandle ? { targetHandle } : {}),
      },
    };
  });
}

/** Pick correct handle routing after layout — flowchart vs journey swimlane */
export function normalizeBoardEdges(nodes, edges, layout = 'down', mermaidSource = null, options = {}) {
  const preserveSaved = options.preserveSaved !== false;
  if (isFlowchartBoard(nodes)) {
    let dir = layout;
    if (mermaidSource) {
      try {
        const m = mermaidSource.trim().match(/^(?:flowchart|graph)\s+(TD|TB|BT|LR|RL|DOWN|UP)/i);
        if (m) {
          const d = m[1].toUpperCase();
          if (d === 'LR') dir = 'right';
          else if (d === 'RL') dir = 'left';
          else if (d === 'BT' || d === 'UP') dir = 'up';
          else dir = 'down';
        }
      } catch { /* keep layout */ }
    }
    return normalizeFlowchartEdgeHandles(nodes, edges, dir, { preserveSaved });
  }
  return normalizeJourneyEdgeHandles(nodes, edges, { preserveSaved });
}

export function branchIndexFromHandle(sourceHandle, siblings = []) {
  if (sourceHandle && BRANCH_HANDLES[sourceHandle] != null) {
    return BRANCH_HANDLES[sourceHandle];
  }
  return siblings.length;
}

export function normalizeFlowType(flowType) {
  if (!flowType || flowType === 'process') return EDGE_FLOW.DEFAULT;
  return flowType;
}

/**
 * Decision → always conditional.
 * Fork → journey or conditional.
 * IO → data.
 * Journey step → journey.
 * Everything else → default (solid).
 */
export function inferFlowType(source, target, { explicitFlow } = {}) {
  const flow = normalizeFlowType(explicitFlow);
  if (flow && flow !== 'auto' && Object.values(EDGE_FLOW).includes(flow)) {
    return flow;
  }
  if (explicitFlow === 'journey') return 'journey';

  if (isDecisionNode(source)) return EDGE_FLOW.CONDITIONAL;

  if (isForkNode(source)) {
    if (isJourneyNode(target) || isJourneyNode(source)) return 'journey';
    return EDGE_FLOW.CONDITIONAL;
  }

  if (source?.type === NODE_TYPES.IO || target?.type === NODE_TYPES.IO) {
    return EDGE_FLOW.DATA;
  }

  if (isJourneyNode(source) && isJourneyNode(target)) return 'journey';

  return EDGE_FLOW.DEFAULT;
}

export function inferEdgeRenderType(flowType, edgeStyle = 'smoothstep') {
  if (flowType === 'journey') return 'journey';
  return edgeStyle;
}

export function buildEdgeData({
  source,
  target,
  siblings = [],
  explicitFlow,
  label = '',
  sourceHandle,
  targetHandle,
}) {
  const flowType = inferFlowType(source, target, { explicitFlow });
  const branchIndex = branchIndexFromHandle(sourceHandle, siblings);
  const isJourney = flowType === 'journey';
  const isConditional = flowType === EDGE_FLOW.CONDITIONAL;
  const animated = !isJourney && (isConditional || flowType === EDGE_FLOW.DATA);

  return {
    label: label || '',
    flowType: isJourney ? EDGE_FLOW.DEFAULT : flowType,
    journeyFlow: isJourney,
    branch: isConditional || isJourney,
    branchIndex,
    sourceHandle: sourceHandle || null,
    targetHandle: targetHandle || null,
    branchColor: isConditional ? BRANCH_COLORS[branchIndex % BRANCH_COLORS.length] : null,
    animated,
  };
}

export function resolveEdgeType(data, flowType, edgeStyle, nodes, sourceId, targetId) {
  const source = nodes.find((n) => n.id === sourceId);
  const target = nodes.find((n) => n.id === targetId);
  const inferred = inferFlowType(source, target, {
    explicitFlow: data?.journeyFlow ? 'journey' : data?.flowType,
  });
  if (inferred === 'journey' || data?.journeyFlow) return 'journey';
  return edgeStyle;
}
