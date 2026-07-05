import { useCallback, useEffect, useRef } from 'react';
import { TOOL } from '../../types/diagram';
import { findStrokeAt } from '../../lib/strokeHitTest';

const DRAW_TOOLS = [TOOL.PENCIL, TOOL.HIGHLIGHTER, TOOL.ERASER, TOOL.RECT, TOOL.CIRCLE, TOOL.ARROW];
const STROKE_TOOLS = [TOOL.PENCIL, TOOL.HIGHLIGHTER];

const STROKE_STYLE = {
  [TOOL.PENCIL]: { color: '#1B1D28', width: 2.5, opacity: 1 },
  [TOOL.HIGHLIGHTER]: { color: '#f9e547', width: 10, opacity: 0.4 },
};

function strokeLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

function drawPath(ctx, points, style, zoom) {
  if (!points?.length) return;
  const lineWidth = Math.max(style.width / zoom, 1.5);
  ctx.beginPath();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = style.opacity ?? 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (points.length === 1) {
    ctx.arc(points[0].x, points[0].y, lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = style.color;
    ctx.fill();
    return;
  }
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
}

export default function DrawingLayer({
  strokes,
  activeTool,
  isDrawActive,
  viewport,
  onStrokeComplete,
  onStrokeRemove,
}) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const strokeTool = useRef(null);
  const currentPoints = useRef([]);
  const shapeStart = useRef(null);

  const isDrawTool = DRAW_TOOLS.includes(activeTool);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    strokes.forEach((s) => {
      if (STROKE_TOOLS.includes(s.tool)) {
        drawPath(ctx, s.points, {
          color: s.color || STROKE_STYLE[s.tool]?.color,
          width: s.width || STROKE_STYLE[s.tool]?.width,
          opacity: s.opacity ?? STROKE_STYLE[s.tool]?.opacity,
        }, viewport.zoom);
      } else if (s.tool === TOOL.RECT) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = Math.max((s.width || 2) / viewport.zoom, 1.5);
        ctx.strokeRect(s.x, s.y, s.w, s.h);
      } else if (s.tool === TOOL.CIRCLE) {
        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = Math.max((s.width || 2) / viewport.zoom, 1.5);
        ctx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.tool === TOOL.ARROW) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = Math.max((s.width || 2) / viewport.zoom, 1.5);
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      }
    });
    ctx.restore();
  }, [strokes, viewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ro = new ResizeObserver(() => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      redraw();
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(redraw, [redraw]);

  const toFlow = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
    };
  };

  const tryErase = (e) => {
    const p = toFlow(e);
    const hit = findStrokeAt(strokes, p.x, p.y);
    if (hit?.id) onStrokeRemove?.(hit.id);
  };

  const commitStroke = (tool, points) => {
    const style = STROKE_STYLE[tool];
    if (!style || !points?.length) return;
    if (points.length === 1 || strokeLength(points) >= 1) {
      onStrokeComplete?.({
        tool,
        points,
        color: style.color,
        width: style.width,
        opacity: style.opacity,
      });
    }
  };

  const onPointerDown = (e) => {
    if (!isDrawActive || !isDrawTool) return;
    e.preventDefault();
    e.stopPropagation();
    canvasRef.current?.setPointerCapture(e.pointerId);

    if (activeTool === TOOL.ERASER) {
      tryErase(e);
      drawing.current = true;
      return;
    }

    drawing.current = true;
    strokeTool.current = activeTool;
    const p = toFlow(e);
    currentPoints.current = [p];
    shapeStart.current = p;
  };

  const onPointerMove = (e) => {
    if (!drawing.current) return;

    if (strokeTool.current === TOOL.ERASER || activeTool === TOOL.ERASER) {
      tryErase(e);
      return;
    }

    const p = toFlow(e);
    const tool = strokeTool.current;

    if (STROKE_TOOLS.includes(tool)) {
      currentPoints.current.push(p);
      redraw();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.zoom, viewport.zoom);
      drawPath(ctx, currentPoints.current, STROKE_STYLE[tool], viewport.zoom);
      ctx.restore();
    }
  };

  const finishStroke = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);

    const tool = strokeTool.current;
    strokeTool.current = null;

    if (tool === TOOL.ERASER) return;

    const end = toFlow(e);

    if (STROKE_TOOLS.includes(tool)) {
      const pts = [...currentPoints.current];
      const last = pts[pts.length - 1];
      if (!last || last.x !== end.x || last.y !== end.y) pts.push(end);
      commitStroke(tool, pts);
    } else if (tool === TOOL.RECT) {
      const start = shapeStart.current;
      if (Math.abs(end.x - start.x) > 4 || Math.abs(end.y - start.y) > 4) {
        onStrokeComplete?.({
          tool: TOOL.RECT,
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          w: Math.abs(end.x - start.x),
          h: Math.abs(end.y - start.y),
          color: '#1B1D28',
          width: 2,
        });
      }
    } else if (tool === TOOL.CIRCLE) {
      const start = shapeStart.current;
      const r = Math.hypot(end.x - start.x, end.y - start.y);
      if (r > 4) {
        onStrokeComplete?.({ tool: TOOL.CIRCLE, cx: start.x, cy: start.y, r, color: '#1B1D28', width: 2 });
      }
    } else if (tool === TOOL.ARROW) {
      const start = shapeStart.current;
      if (Math.hypot(end.x - start.x, end.y - start.y) > 4) {
        onStrokeComplete?.({
          tool: TOOL.ARROW, x1: start.x, y1: start.y, x2: end.x, y2: end.y, color: '#1B1D28', width: 2,
        });
      }
    }

    currentPoints.current = [];
  };

  if (!isDrawActive && !strokes.length) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[18] dg-draw-canvas"
      style={{
        pointerEvents: isDrawActive && isDrawTool ? 'auto' : 'none',
        touchAction: 'none',
        cursor: activeTool === TOOL.ERASER ? 'cell' : activeTool === TOOL.HAND ? 'grab' : 'crosshair',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishStroke}
      onPointerLeave={finishStroke}
      onPointerCancel={finishStroke}
    />
  );
}
