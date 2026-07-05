const GUIDE = '#3B82F6';

export default function AlignmentGuides({ guides, viewport }) {
  if (!guides?.length) return null;
  const { x: vx, y: vy, zoom } = viewport;
  return (
    <svg className="absolute inset-0 pointer-events-none z-[12]" style={{ width: '100%', height: '100%' }}>
      {guides.map((g, i) => {
        if (g.type === 'v') {
          const sx = g.pos * zoom + vx;
          return <line key={i} x1={sx} y1={g.from * zoom + vy} x2={sx} y2={g.to * zoom + vy} stroke={GUIDE} strokeWidth={1} strokeDasharray="4 3" opacity={0.8} />;
        }
        const sy = g.pos * zoom + vy;
        return <line key={i} x1={g.from * zoom + vx} y1={sy} x2={g.to * zoom + vx} y2={sy} stroke={GUIDE} strokeWidth={1} strokeDasharray="4 3" opacity={0.8} />;
      })}
    </svg>
  );
}
