const FONT = '13px "DM Sans", system-ui, sans-serif';
const LINE_HEIGHT = 16;
const PADDING = 8;

let canvas;

function ctx() {
  if (typeof document === 'undefined') return null;
  if (!canvas) canvas = document.createElement('canvas');
  return canvas.getContext('2d');
}

function measureLines(lines) {
  const c = ctx();
  if (!c) {
    const maxChars = Math.max(...lines.map((l) => l.length), 1);
    return { width: maxChars * 7.2, height: lines.length * LINE_HEIGHT };
  }
  c.font = FONT;
  let maxW = 0;
  lines.forEach((line) => {
    maxW = Math.max(maxW, c.measureText(line).width);
  });
  return { width: maxW, height: lines.length * LINE_HEIGHT };
}

/** Match Mermaid flowchart node sizing (squareRect + question shapes) */
export function measureMermaidNode(title, description, isDecision) {
  const lines = [title || ''].filter(Boolean);
  if (description) lines.push(description);

  const bbox = measureLines(lines);

  if (isDecision) {
    const w = bbox.width + PADDING;
    const h = bbox.height + PADDING;
    const s = Math.ceil(w + h);
    return { width: Math.max(s, 100), height: Math.max(s, 100) };
  }

  const labelPaddingX = PADDING * 2;
  const labelPaddingY = PADDING;
  return {
    width: Math.max(Math.ceil(bbox.width + labelPaddingX * 2), 96),
    height: Math.max(Math.ceil(bbox.height + labelPaddingY * 2), 44),
  };
}
