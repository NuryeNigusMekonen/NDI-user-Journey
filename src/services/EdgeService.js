import { addEdge, applyEdgeChanges, reconnectEdge } from '@xyflow/react';
import { buildEdgeData, inferEdgeRenderType, resolveEdgeHandles } from './FlowInference';
import { EDGE_FLOW } from '../types/diagram';

export const EdgeService = {
  applyChanges(changes, edges) {
    return applyEdgeChanges(changes, edges);
  },

  connect(connection, edges, nodes, edgeStyle = 'smoothstep') {
    const source = nodes.find((n) => n.id === connection.source);
    const target = nodes.find((n) => n.id === connection.target);
    const sideHandles = resolveEdgeHandles(source, target);
    const resolved = { ...connection, ...sideHandles };
    const siblings = edges.filter((e) => e.source === resolved.source);
    const data = buildEdgeData({
      source,
      target,
      siblings,
      sourceHandle: resolved.sourceHandle,
    });
    const flowType = data.journeyFlow ? 'journey' : data.flowType;
    const type = nodes.some((n) => n.type === 'entity')
      ? 'relationship'
      : inferEdgeRenderType(flowType, edgeStyle);

    return addEdge(
      {
        ...resolved,
        type,
        data: {
          ...data,
          flowMode: 'auto',
          handlesPinned: true,
          sourceHandle: resolved.sourceHandle,
          targetHandle: resolved.targetHandle,
        },
        animated: data.animated,
      },
      edges,
    );
  },

  reconnect(oldEdge, newConnection, edges, nodes) {
    const source = nodes.find((n) => n.id === (newConnection.source || oldEdge.source));
    const target = nodes.find((n) => n.id === (newConnection.target || oldEdge.target));
    const sideHandles = resolveEdgeHandles(source, target);
    const sourceHandle = newConnection.sourceHandle ?? sideHandles.sourceHandle ?? oldEdge.sourceHandle;
    const targetHandle = newConnection.targetHandle ?? sideHandles.targetHandle ?? oldEdge.targetHandle;
    const merged = {
      ...oldEdge,
      ...newConnection,
      sourceHandle,
      targetHandle,
    };
    const siblings = edges.filter((e) => e.source === merged.source && e.id !== oldEdge.id);
    const explicitFlow = oldEdge.data?.flowMode === 'auto'
      ? undefined
      : (oldEdge.data?.journeyFlow ? 'journey' : oldEdge.data?.flowType);
    const data = buildEdgeData({
      source,
      target,
      siblings,
      explicitFlow,
      label: oldEdge.data?.label || '',
      sourceHandle: merged.sourceHandle,
      targetHandle: merged.targetHandle,
    });
    return reconnectEdge(
      oldEdge,
      {
        ...merged,
        data: {
          ...data,
          flowMode: oldEdge.data?.flowMode || 'auto',
          handlesPinned: true,
          sourceHandle,
          targetHandle,
        },
        animated: data.animated,
      },
      edges,
    );
  },

  setLabel(edges, edgeId, label) {
    return edges.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, label } } : e));
  },

  setFlowType(edges, edgeId, flowType) {
    return edges.map((e) => {
      if (e.id !== edgeId) return e;
      const normalized = flowType === 'process' ? EDGE_FLOW.DEFAULT : flowType;
      const animated = normalized === EDGE_FLOW.CONDITIONAL || normalized === EDGE_FLOW.DATA;
      const journeyFlow = normalized === 'journey';
      return {
        ...e,
        type: journeyFlow ? 'journey' : (e.type === 'journey' ? 'smoothstep' : e.type),
        data: {
          ...e.data,
          flowType: journeyFlow ? EDGE_FLOW.DEFAULT : normalized,
          journeyFlow,
          flowMode: normalized,
          animated,
          branch: normalized === EDGE_FLOW.CONDITIONAL || journeyFlow,
        },
      };
    });
  },

  removeForNodes(edges, nodeIds) {
    const set = new Set(nodeIds);
    return edges.filter((e) => !set.has(e.source) && !set.has(e.target));
  },

  highlightConnected(edges, nodeId) {
    if (!nodeId) return edges.map((e) => ({ ...e, data: { ...e.data, highlighted: false } }));
    return edges.map((e) => ({
      ...e,
      data: { ...e.data, highlighted: e.source === nodeId || e.target === nodeId },
    }));
  },
};
