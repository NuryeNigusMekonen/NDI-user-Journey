import { Handle, Position } from '@xyflow/react';

const SIDES = [
  { side: 'top', position: Position.Top },
  { side: 'right', position: Position.Right },
  { side: 'bottom', position: Position.Bottom },
  { side: 'left', position: Position.Left },
];

/** Left/right only — used by journey steps for horizontal flow */
export const SIDE_PORTS = [
  { side: 'right', position: Position.Right },
  { side: 'left', position: Position.Left },
];

/** Bidirectional connection ports — drag from any dot to connect */
export default function ConnectionPorts({ sides = SIDES }) {
  return (
    <>
      {sides.map(({ side, position }) => (
        <span key={side} className="dg-port-group">
          <Handle
            type="source"
            position={position}
            id={`${side}-out`}
            className="dg-port"
          />
          <Handle
            type="target"
            position={position}
            id={`${side}-in`}
            className="dg-port"
          />
        </span>
      ))}
    </>
  );
}
