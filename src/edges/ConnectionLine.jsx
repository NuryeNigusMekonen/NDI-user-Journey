import { getBezierPath, getSmoothStepPath, Position } from '@xyflow/react';

const positionMap = {
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top,
  [Position.Left]: Position.Right,
  [Position.Right]: Position.Left,
};

export default function ConnectionLine({
  fromX, fromY, toX, toY, fromPosition, toPosition, connectionLineType = 'smoothstep',
}) {
  const targetPosition = positionMap[fromPosition] || Position.Left;
  const isStep = connectionLineType === 'smoothstep' || connectionLineType === 'orthogonal';

  const [path] = isStep
    ? getSmoothStepPath({
      sourceX: fromX,
      sourceY: fromY,
      sourcePosition: fromPosition,
      targetX: toX,
      targetY: toY,
      targetPosition,
      borderRadius: connectionLineType === 'orthogonal' ? 0 : 16,
    })
    : getBezierPath({
      sourceX: fromX,
      sourceY: fromY,
      sourcePosition: fromPosition,
      targetX: toX,
      targetY: toY,
      targetPosition,
      curvature: 0.4,
    });

  return (
    <g>
      <path
        fill="none"
        stroke="#3B82F6"
        strokeWidth={2.5}
        strokeDasharray="8 5"
        strokeLinecap="round"
        d={path}
        style={{ animation: 'dash-flow 0.6s linear infinite' }}
      />
      <circle cx={toX} cy={toY} r={5} fill="#3B82F6" fillOpacity={0.25} stroke="#3B82F6" strokeWidth={2} />
    </g>
  );
}
