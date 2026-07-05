import { applyNodeChanges } from '@xyflow/react';
import { NODE_TYPES, RF_TYPE_MAP, DEFAULT_NODE_DATA } from '../types/diagram';

const JOURNEY_DIMS = {
  step: { width: 228, height: 96 },
  note: { width: 228, height: 64 },
  fork: { width: 140, height: 160 },
};

export const NodeService = {
  applyChanges(changes, nodes) {
    return applyNodeChanges(changes, nodes);
  },

  create(paletteType, position, options = {}) {
    const rfType = RF_TYPE_MAP[paletteType] || NODE_TYPES.ACTION;
    const defaults = DEFAULT_NODE_DATA[paletteType] || DEFAULT_NODE_DATA.action;
    const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const node = {
      id,
      type: rfType,
      position,
      data: { ...defaults, locked: false, ...options.data },
    };

    if (paletteType === 'annotation') {
      node.style = { width: 160, height: 100 };
      node.zIndex = 5;
    }
    if (paletteType === 'text') {
      node.style = { width: 140, height: 36 };
      node.zIndex = 6;
      node.data.justCreated = true;
    }
    if (paletteType === 'screen') {
      node.style = { width: 260, height: 140 };
    }
    if (JOURNEY_DIMS[paletteType]) {
      const dims = JOURNEY_DIMS[paletteType];
      node.width = dims.width;
      node.height = dims.height;
      node.style = { width: dims.width, height: dims.height };
      if (paletteType === 'step' && options.stepNum != null) {
        node.data.stepNum = options.stepNum;
      }
    }

    return node;
  },

  nextStepNum(nodes) {
    const nums = nodes
      .filter((n) => n.type === NODE_TYPES.STEP)
      .map((n) => n.data?.stepNum)
      .filter((n) => typeof n === 'number');
    return nums.length ? Math.max(...nums) + 1 : 1;
  },

  createText(position, options = {}) {
    const node = this.create('text', position);
    return {
      ...node,
      data: { ...node.data, ...options, justCreated: true },
    };
  },

  updateData(nodes, id, patch) {
    return nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n);
  },

  duplicate(nodes, ids) {
    const set = new Set(Array.isArray(ids) ? ids : [ids]);
    const copies = nodes.filter((n) => set.has(n.id)).map((n) => ({
      ...n,
      id: `${n.id}-copy-${Date.now()}`,
      position: { x: n.position.x + 40, y: n.position.y + 40 },
      selected: false,
      data: JSON.parse(JSON.stringify(n.data)),
    }));
    return [...nodes, ...copies];
  },

  remove(nodes, ids) {
    const set = new Set(Array.isArray(ids) ? ids : [ids]);
    return nodes.filter((n) => !set.has(n.id));
  },

  setLocked(nodes, id, locked) {
    return nodes.map((n) => n.id === id ? { ...n, draggable: !locked, data: { ...n.data, locked } } : n);
  },

  bringForward(nodes, id) {
    const maxZ = Math.max(0, ...nodes.map((n) => n.zIndex || 0));
    return nodes.map((n) => n.id === id ? { ...n, zIndex: maxZ + 1 } : n);
  },

  sendBackward(nodes, id) {
    const minZ = Math.min(0, ...nodes.map((n) => n.zIndex || 0));
    return nodes.map((n) => n.id === id ? { ...n, zIndex: minZ - 1 } : n);
  },

  copy(nodes, ids) {
    return nodes.filter((n) => ids.includes(n.id)).map((n) => ({
      ...n,
      id: `${n.type}-clip`,
      data: JSON.parse(JSON.stringify(n.data)),
    }));
  },

  paste(nodes, clips, origin) {
    const base = clips[0]?.position || { x: 0, y: 0 };
    return [
      ...nodes,
      ...clips.map((c, i) => ({
        ...c,
        id: `${c.type}-${Date.now()}-${i}`,
        position: { x: origin.x + (c.position.x - base.x), y: origin.y + (c.position.y - base.y) },
      })),
    ];
  },
};
