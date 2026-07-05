import { useEffect, useState } from 'react';
import { User, Eye, EyeOff, Pencil, Users, Radio } from 'lucide-react';
import { getDisplayName, setDisplayName, needsDisplayName, displayLabel } from '../lib/guestIdentity';

export default function FollowPanel({
  peers,
  self,
  followingId,
  onToggleFollow,
  onNameChange,
  isLive,
}) {
  const [editing, setEditing] = useState(() => needsDisplayName());
  const [nameDraft, setNameDraft] = useState(getDisplayName);
  const [expanded, setExpanded] = useState(() => needsDisplayName());

  useEffect(() => {
    if (needsDisplayName()) {
      setEditing(true);
      setExpanded(true);
    }
  }, []);

  const saveName = () => {
    const saved = setDisplayName(nameDraft);
    onNameChange(saved || nameDraft.trim());
    setEditing(false);
  };

  const online = peers.filter((p) => p.sessionId !== self?.sessionId);
  const myLabel = displayLabel(self?.name || getDisplayName());

  return (
    <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-white/95 border border-[#E8E6DF] shadow-sm">
        {editing ? (
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => { e.preventDefault(); saveName(); }}
          >
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="text-xs w-32 px-2 py-1 rounded-md border border-[#E8E6DF] focus:outline-none focus:ring-1 focus:ring-brand/40"
              placeholder="Enter your name"
              maxLength={32}
            />
            <button type="submit" className="text-[10px] px-2 py-1 rounded-md bg-brand text-white font-semibold">Save</button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => { setNameDraft(getDisplayName()); setEditing(true); }}
            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#1B1D28]"
            title="Change your display name"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: self?.color || '#c8102e' }}
            />
            <span className="font-medium text-[#1B1D28]">{myLabel}</span>
            <Pencil className="w-3 h-3 opacity-50" />
          </button>
        )}

        <span className="text-[#E8E6DF]">|</span>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs hover:text-[#1B1D28]"
          title="See who is online and follow their view"
        >
          <Users className="w-3.5 h-3.5 text-[#6B7280]" />
          <span className="font-medium text-[#374151] tabular-nums">{online.length + 1} here</span>
          {isLive ? (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
              <Radio className="w-2.5 h-2.5" /> Live
            </span>
          ) : (
            <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">Offline sync</span>
          )}
        </button>
      </div>

      {expanded && (
        <div className="pointer-events-auto w-[260px] p-2.5 rounded-xl bg-white/95 border border-[#E8E6DF] shadow-sm">
          {!getDisplayName() && (
            <p className="text-[10px] text-brand font-medium leading-snug mb-2 px-1 bg-brand/5 rounded-lg py-1.5">
              Set your name above so teammates know who you are.
            </p>
          )}
          <p className="text-[10px] text-[#6B7280] leading-snug mb-2 px-1">
            {isLive
              ? 'Anyone with this link appears here in real time. Click Follow to watch where they are looking.'
              : 'Connect Supabase for live follow across devices. Same-browser tabs still sync locally.'}
          </p>
          {online.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] px-1 py-2">No one else here yet — share the link with your team.</p>
          ) : (
            <div className="space-y-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#9CA3AF] px-1 pb-1">Follow view</p>
              {online.map((peer) => {
                const isFollowing = followingId === peer.sessionId;
                const label = displayLabel(peer.name);
                return (
                  <button
                    key={peer.sessionId}
                    type="button"
                    onClick={() => onToggleFollow(peer.sessionId)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left transition-colors ${
                      isFollowing ? 'bg-brand/10 text-brand' : 'hover:bg-[#F3F4F6] text-[#1B1D28]'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: peer.color }}
                    >
                      {label[0].toUpperCase()}
                    </span>
                    <span className="text-xs font-medium truncate flex-1">{label}</span>
                    {peer.mode === 'edit' && (
                      <span className="text-[8px] text-[#9CA3AF] shrink-0">editing</span>
                    )}
                    {isFollowing ? (
                      <EyeOff className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 shrink-0 opacity-40" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {followingId && (
        <div className="pointer-events-auto px-3 py-1.5 rounded-full bg-brand text-white text-[10px] font-semibold shadow-sm flex items-center gap-1.5">
          <Eye className="w-3 h-3" />
          Following {displayLabel(peers.find((p) => p.sessionId === followingId)?.name)}
          <button
            type="button"
            onClick={() => onToggleFollow(followingId)}
            className="ml-1 underline opacity-80 hover:opacity-100"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
