export const WhiteboardService = {
  createStroke(tool, points, options = {}) {
    return {
      id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tool,
      points,
      color: options.color || '#1B1D28',
      width: options.width || 2,
      opacity: options.opacity ?? 1,
    };
  },

  createShape(tool, bounds, options = {}) {
    return {
      id: `shape-${Date.now()}`,
      tool,
      ...bounds,
      color: options.color || '#1B1D28',
      width: options.width || 2,
      fill: options.fill || 'transparent',
    };
  },
};
