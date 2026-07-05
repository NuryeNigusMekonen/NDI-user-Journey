import { TOOL } from '../types/diagram';

const DRAW_TOOLS = new Set([
  TOOL.PENCIL, TOOL.HIGHLIGHTER, TOOL.ERASER, TOOL.RECT, TOOL.CIRCLE, TOOL.ARROW,
]);

export function getToolCursorClass(activeTool, { spacePan } = {}) {
  if (spacePan) return 'dg-cursor-hand';

  if (activeTool === TOOL.HAND) return 'dg-cursor-hand';
  if (activeTool === TOOL.HIGHLIGHTER) return 'dg-cursor-highlighter';
  if (activeTool === TOOL.ERASER) return 'dg-cursor-eraser';
  if (activeTool === TOOL.PENCIL) return 'dg-cursor-pencil';
  if (DRAW_TOOLS.has(activeTool)) return 'dg-cursor-pencil';

  switch (activeTool) {
    case TOOL.TEXT:
      return 'dg-cursor-text';
    case TOOL.COMMENT:
      return 'dg-cursor-comment';
    case TOOL.POINTER:
    default:
      return '';
  }
}
