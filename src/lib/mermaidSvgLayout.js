function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findNodeGroup(svg, vertexId, renderId) {
  const byDataId = svg.querySelector(`[data-id="${vertexId}"]`);
  if (byDataId?.classList?.contains('node') || byDataId?.closest?.('g.node')) {
    return byDataId.closest('g.node') || byDataId;
  }

  const patterns = [
    `[id="${renderId}-flowchart-${vertexId}"]`,
    `[id^="${renderId}-flowchart-${vertexId}-"]`,
    `[id$="-flowchart-${vertexId}"]`,
    `[id*="-flowchart-${vertexId}-"]`,
  ];

  for (const sel of patterns) {
    const el = svg.querySelector(sel);
    if (el) return el.closest('g.node') || el.closest('g') || el;
  }

  const suffix = new RegExp(`flowchart-${escapeRegExp(vertexId)}-\\d+$`);
  for (const g of svg.querySelectorAll('g.node, g[class*="node"]')) {
    const gid = g.id || '';
    if (suffix.test(gid)) return g;
    if (g.getAttribute('data-id') === vertexId) return g;
  }
  return null;
}

function readBox(el, svg) {
  if (!el) return null;
  try {
    const box = el.getBBox();
    if (box.width > 0 && box.height > 0) {
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }
  } catch { /* ignore */ }

  const container = el.querySelector('.label-container');
  if (container) {
    try {
      const box = container.getBBox();
      if (box.width > 0 && box.height > 0) {
        const nodeBox = el.getBBox();
        return {
          x: nodeBox.x,
          y: nodeBox.y,
          width: nodeBox.width,
          height: nodeBox.height,
        };
      }
    } catch { /* ignore */ }
  }

  const rect = el.querySelector('rect[width][height]');
  if (rect) {
    const w = parseFloat(rect.getAttribute('width')) || 0;
    const h = parseFloat(rect.getAttribute('height')) || 0;
    if (w > 0 && h > 0) {
      const pt = svg.createSVGPoint();
      const ctm = rect.getScreenCTM?.();
      if (ctm) {
        const bbox = rect.getBBox();
        return { x: bbox.x, y: bbox.y, width: w, height: h };
      }
    }
  }
  return null;
}

/**
 * Extract node positions from a Mermaid-rendered SVG (browser only).
 * Returns Map<vertexId, {x,y,width,height}>
 */
export function extractMermaidSvgLayout(svgString, vertexIds, renderId) {
  const positions = new Map();
  if (typeof document === 'undefined' || !svgString?.trim()) return positions;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none;z-index:-1;width:max-content;height:max-content;overflow:visible';
  container.innerHTML = svgString.trim();
  document.body.appendChild(container);

  try {
    const svg = container.querySelector('svg');
    if (!svg) return positions;

    vertexIds.forEach((id) => {
      const group = findNodeGroup(svg, id, renderId);
      const box = readBox(group, svg);
      if (box) positions.set(id, box);
    });
  } finally {
    document.body.removeChild(container);
  }

  return positions;
}
