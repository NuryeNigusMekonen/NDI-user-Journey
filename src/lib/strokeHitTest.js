import { TOOL } from '../types/diagram';

const ERASER_RADIUS = 12;

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function hitStroke(stroke, x, y, radius = ERASER_RADIUS) {
  if (stroke.tool === TOOL.PENCIL || stroke.tool === TOOL.HIGHLIGHTER) {
    const pts = stroke.points || [];
    const threshold = radius + (stroke.width || 2) / 2;
    for (let i = 1; i < pts.length; i++) {
      if (distToSegment(x, y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= threshold) {
        return true;
      }
    }
    if (pts.length === 1) {
      return Math.hypot(x - pts[0].x, y - pts[0].y) <= threshold;
    }
    return false;
  }
  if (stroke.tool === TOOL.RECT) {
    const pad = radius;
    return x >= stroke.x - pad && x <= stroke.x + stroke.w + pad
      && y >= stroke.y - pad && y <= stroke.y + stroke.h + pad;
  }
  if (stroke.tool === TOOL.CIRCLE) {
    const d = Math.hypot(x - stroke.cx, y - stroke.cy);
    return d <= stroke.r + radius;
  }
  if (stroke.tool === TOOL.ARROW) {
    return distToSegment(x, y, stroke.x1, stroke.y1, stroke.x2, stroke.y2) <= radius + (stroke.width || 2) / 2;
  }
  return false;
}

export function findStrokeAt(strokes, x, y, radius = ERASER_RADIUS) {
  for (let i = strokes.length - 1; i >= 0; i--) {
    if (hitStroke(strokes[i], x, y, radius)) return strokes[i];
  }
  return null;
}

export function removeStroke(strokes, strokeId) {
  return strokes.filter((s) => s.id !== strokeId);
}
