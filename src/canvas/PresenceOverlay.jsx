import { useMemo } from 'react';

function RemoteCursor({ peer, viewport }) {
  if (!peer.cursor || !viewport) return null;

  const screenX = peer.cursor.x * viewport.zoom + viewport.x;
  const screenY = peer.cursor.y * viewport.zoom + viewport.y;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-transform duration-75"
      style={{ left: screenX, top: screenY, transform: 'translate(-2px, -2px)' }}
    >
      <svg width="18" height="22" viewBox="0 0 18 22" fill="none" className="drop-shadow-sm">
        <path
          d="M1 1L1 16.5L5.5 12.5L9 20L11.5 19L8 11.5L14 11.5L1 1Z"
          fill={peer.color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      <span
        className="absolute left-4 top-3 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap shadow-sm"
        style={{ background: peer.color }}
      >
        {peer.name}
      </span>
    </div>
  );
}

export default function PresenceOverlay({ peers, self, viewport, followingId }) {
  const visible = useMemo(
    () => peers.filter((p) => p.sessionId !== self?.sessionId && p.cursor),
    [peers, self],
  );

  if (!visible.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[25] overflow-hidden">
      {visible.map((peer) => (
        <RemoteCursor
          key={peer.sessionId}
          peer={peer}
          viewport={viewport}
        />
      ))}
      {followingId && (
        <div className="absolute bottom-20 right-4 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-medium">
          Synced to collaborator viewport
        </div>
      )}
    </div>
  );
}
