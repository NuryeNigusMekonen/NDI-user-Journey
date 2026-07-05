import { useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil, Users, Radio } from 'lucide-react';
import { getDisplayName, setDisplayName, needsDisplayName, displayLabel } from '../lib/guestIdentity';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function WorkspacePeoplePanel() {
  const api = useWorkspaceStore((s) => s.api);
  const [editing, setEditing] = useState(() => needsDisplayName());
  const [nameDraft, setNameDraft] = useState(getDisplayName);
  const [expanded, setExpanded] = useState(false);

  const peers = api?.peers || [];
  const self = api?.self;
  const followingId = api?.followingId;
  const isLive = api?.isLive;

  useEffect(() => {
    if (needsDisplayName()) setEditing(true);
  }, []);

  const saveName = () => {
    const saved = setDisplayName(nameDraft);
    api?.onNameChange?.(saved || nameDraft.trim());
    setEditing(false);
  };

  const online = peers.filter((p) => p.sessionId !== self?.sessionId);
  const myLabel = displayLabel(self?.name || getDisplayName());

  return (
    <div className="relative flex items-center gap-2 shrink-0">
      {editing ? (
        <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); saveName(); }}>
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            className="text-xs w-28 px-2 py-1.5 rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-brand/40"
            placeholder="Your name"
            maxLength={32}
          />
          <button type="submit" className="text-[10px] px-2 py-1.5 rounded-lg bg-brand text-white font-semibold">OK</button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => { setNameDraft(getDisplayName()); setEditing(true); }}
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs hover:bg-cream transition-colors"
          title="Change your display name"
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: self?.color || '#c8102e' }} />
          <span className="font-medium text-ink">{myLabel}</span>
          <Pencil className="w-3 h-3 text-ink-muted opacity-60" />
        </button>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          expanded ? 'bg-brand/10 text-brand' : 'hover:bg-cream text-[#374151]'
        }`}
        title="Who is online — follow their view"
      >
        <Users className="w-3.5 h-3.5" />
        <span className="tabular-nums">{online.length + 1}</span>
        {isLive ? (
          <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
            <Radio className="w-2.5 h-2.5" /> Live
          </span>
        ) : null}
      </button>

      {followingId && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand text-white text-[10px] font-semibold">
          <Eye className="w-3 h-3" />
          Following {displayLabel(peers.find((p) => p.sessionId === followingId)?.name)}
          <button type="button" onClick={() => api?.toggleFollow?.(followingId)} className="underline opacity-80 ml-0.5">Stop</button>
        </span>
      )}

      {expanded && (
        <div className="absolute top-full right-0 mt-1 w-64 p-2.5 rounded-xl bg-white border border-line shadow-lg z-50">
          {!getDisplayName() && (
            <p className="text-[10px] text-brand font-medium mb-2 px-1 py-1.5 bg-brand/5 rounded-lg">
              Set your name so teammates know who you are.
            </p>
          )}
          <p className="text-[10px] text-ink-muted leading-snug mb-2 px-1">
            {isLive
              ? 'Click Follow to watch where someone is looking on the map.'
              : 'Share this link — teammates appear here when connected.'}
          </p>
          {online.length === 0 ? (
            <p className="text-xs text-ink-muted px-1 py-1">No one else here yet.</p>
          ) : (
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {online.map((peer) => {
                const isFollowing = followingId === peer.sessionId;
                const label = displayLabel(peer.name);
                return (
                  <button
                    key={peer.sessionId}
                    type="button"
                    onClick={() => api?.toggleFollow?.(peer.sessionId)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                      isFollowing ? 'bg-brand/10 text-brand' : 'hover:bg-cream'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: peer.color }}>
                      {label[0].toUpperCase()}
                    </span>
                    <span className="font-medium truncate flex-1">{label}</span>
                    {peer.mode === 'edit' && <span className="text-[8px] text-ink-muted">editing</span>}
                    {isFollowing ? <EyeOff className="w-3.5 h-3.5 opacity-60" /> : <Eye className="w-3.5 h-3.5 opacity-40" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
