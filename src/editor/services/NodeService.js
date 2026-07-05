import { applyNodeChanges } from '@xyflow/react';

export const NodeService = {
  applyChanges(changes, nodes) {
    return applyNodeChanges(changes, nodes);
  },

  updateData(nodes, nodeId, patch) {
    return nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
    );
  },

  updateStyle(nodes, nodeId, stylePatch) {
    return nodes.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, style: { ...n.data.style, ...stylePatch } } }
        : n,
    );
  },

  duplicate(nodes, nodeId) {
    const source = nodes.find((n) => n.id === nodeId);
    if (!source) return nodes;
    return [...nodes, cloneNode(source)];
  },

  duplicateMany(nodes, ids) {
    const toCopy = nodes.filter((n) => ids.includes(n.id));
    return [...nodes, ...toCopy.map(cloneNode)];
  },

  remove(nodes, nodeId) {
    return nodes.filter((n) => n.id !== nodeId);
  },

  removeMany(nodes, ids) {
    const set = new Set(ids);
    return nodes.filter((n) => !set.has(n.id));
  },

  bringForward(nodes, nodeId) {
    const z = Math.max(...nodes.map((n) => n.data?.style?.zIndex ?? 0), 0);
    return this.updateStyle(nodes, nodeId, { zIndex: z + 1 });
  },

  sendBackward(nodes, nodeId) {
    const z = Math.min(...nodes.map((n) => n.data?.style?.zIndex ?? 0), 0);
    return this.updateStyle(nodes, nodeId, { zIndex: z - 1 });
  },

  setLocked(nodes, nodeId, locked) {
    return nodes.map((n) =>
      n.id === nodeId
        ? {
          ...n,
          draggable: !locked,
          data: { ...n.data, style: { ...n.data.style, locked } },
        }
        : n,
    );
  },

  copyNodes(nodes, ids) {
    return nodes.filter((n) => ids.includes(n.id)).map((n) => cloneNode(n, 0));
  },

  pasteNodes(nodes, copies, position) {
    if (!copies.length) return nodes;
    const baseX = copies[0].position.x;
    const baseY = copies[0].position.y;
    const pasted = copies.map((c, i) => ({
      ...c,
      id: `${c.type}-${Date.now()}-${i}`,
      position: {
        x: position.x + (c.position.x - baseX),
        y: position.y + (c.position.y - baseY),
      },
      selected: false,
    }));
    return [...nodes, ...pasted];
  },
};

function cloneNode(source, offset = 40) {
  return {
    ...source,
    id: `${source.id}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    position: {
      x: source.position.x + offset,
      y: source.position.y + offset,
    },
    selected: false,
    data: JSON.parse(JSON.stringify(source.data)),
  };
}
