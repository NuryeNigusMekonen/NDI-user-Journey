const GUIDE_COLOR = '#c8102e';

export default function AlignmentGuidesOverlay({ guides, viewport }) {
  if (!guides?.length) return null;
  const { x: vx, y: vy, zoom } = viewport;

  return (
    <svg className="absolute inset-0 pointer-events-none z-[12]" style={{ width: '100%', height: '100%' }}>
      {guides.map((g, i) => {
        if (g.type === 'v') {
          const sx = g.pos * zoom + vx;
          const y1 = g.from * zoom + vy;
          const y2 = g.to * zoom + vy;
          return <line key={i} x1={sx} y1={y1} x2={sx} y2={y2} stroke={GUIDE_COLOR} strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />;
        }
        const sy = g.pos * zoom + vy;
        const x1 = g.from * zoom + vx;
        const x2 = g.to * zoom + vx;
        return <line key={i} x1={x1} y1={sy} x2={x2} y2={sy} stroke={GUIDE_COLOR} strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />;
      })}
    </svg>
  );
}
