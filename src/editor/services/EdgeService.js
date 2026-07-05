import { applyEdgeChanges, addEdge, reconnectEdge } from '@xyflow/react';

export const EdgeService = {
  applyChanges(changes, edges) {
    return applyEdgeChanges(changes, edges);
  },

  connect(connection, edges) {
    return addEdge(
      {
        ...connection,
        type: 'uxm',
        data: { branch: false, label: '' },
      },
      edges,
    );
  },

  reconnect(oldEdge, newConnection, edges) {
    return reconnectEdge(oldEdge, newConnection, edges);
  },

  updateData(edges, edgeId, patch) {
    return edges.map((e) =>
      e.id === edgeId ? { ...e, data: { ...e.data, ...patch } } : e,
    );
  },

  removeForNode(edges, nodeId) {
    return edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
  },

  removeForNodes(edges, nodeIds) {
    const set = new Set(nodeIds);
    return edges.filter((e) => !set.has(e.source) && !set.has(e.target));
  },
};
