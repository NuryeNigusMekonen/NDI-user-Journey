import { Handle, Position } from '@xyflow/react';

const BRANCHES = [
  { id: 'branch-right', position: Position.Right, color: '#c8102e' },
  { id: 'branch-bottom', position: Position.Bottom, color: '#d97706' },
  { id: 'branch-left', position: Position.Left, color: '#7c3aed' },
  { id: 'branch-top', position: Position.Top, color: '#5F5E5A' },
];

/** Branch ports for decision / fork — each path gets its own colored connector */
export default function DecisionPorts({ muted = false }) {
  return (
    <>
      <Handle type="target" position={Position.Top} id="in" className="dg-port" />
      {BRANCHES.map(({ id, position, color }) => (
        <Handle
          key={id}
          type="source"
          position={position}
          id={id}
          className={`dg-port dg-branch-port ${muted ? 'dg-flowchart-port' : ''}`}
          style={muted ? undefined : { background: color, borderColor: color }}
        />
      ))}
    </>
  );
}
