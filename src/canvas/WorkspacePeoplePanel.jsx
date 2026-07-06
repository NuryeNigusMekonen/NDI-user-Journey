import { useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil, Users, Radio } from 'lucide-react';
import { getDisplayName, setDisplayName, needsDisplayName, displayLabel } from '../lib/guestIdentity';
import { journeyIdsMatch } from '../lib/journeyMatch';
import { usePresenceStore } from '../store/presenceStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function WorkspacePeoplePanel() {
  const presenceApi = useWorkspaceStore((s) => s.presenceApi);
  const peers = usePresenceStore((s) => s.peers);
  const self = usePresenceStore((s) => s.self);
  const followingId = usePresenceStore((s) => s.followingId);
  const isLive = usePresenceStore((s) => s.isLive);
  const connected = usePresenceStore((s) => s.connected);
  const remoteMode = usePresenceStore((s) => s.remoteMode);

  const [editing, setEditing] = useState(() => needsDisplayName());
  const [nameDraft, setNameDraft] = useState(getDisplayName);
  const [myName, setMyName] = useState(() => getDisplayName());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (needsDisplayName()) setEditing(true);
  }, []);

  useEffect(() => {
    if (self?.name && self.name !== 'Guest') setMyName(self.name);
  }, [self?.name]);

  const saveName = () => {
    const saved = setDisplayName(nameDraft);
    const finalName = saved || nameDraft.trim();
    setMyName(finalName);
    presenceApi?.onNameChange?.(finalName);
    setEditing(false);
  };

  const online = peers;
  const myLabel = displayLabel(myName || self?.name);
  const journeyId = presenceApi?.journeyId;

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
        {isLive && connected ? (
          <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
            <Radio className="w-2.5 h-2.5" /> Live
          </span>
        ) : isLive ? (
          <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
            Connecting…
          </span>
        ) : null}
      </button>

      {followingId && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand text-white text-[10px] font-semibold max-w-[200px]">
          <Eye className="w-3 h-3 shrink-0" />
          <span className="truncate">
            Following {displayLabel(peers.find((p) => p.sessionId === followingId)?.name)}
            {(() => {
              const peer = peers.find((p) => p.sessionId === followingId);
              const onSame = journeyIdsMatch(peer?.journeyId, journeyId);
              if (!peer?.journeyTitle) return '';
              return onSame ? ' · live' : ` · ${peer.journeyTitle}`;
            })()}
          </span>
          <button type="button" onClick={() => presenceApi?.toggleFollow?.(followingId)} className="underline opacity-80 shrink-0">Stop</button>
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
            {remoteMode === 'db'
              ? 'Synced across browsers and devices. Follow to jump to their page.'
              : remoteMode === 'realtime'
                ? 'Synced via realtime. Open the same URL in each browser.'
                : isLive
                  ? 'Connecting to server… If this stays empty, run the latest supabase/schema.sql in Supabase.'
                  : 'Configure Supabase in .env for cross-browser presence.'}
          </p>
          {online.length === 0 ? (
            <p className="text-xs text-ink-muted px-1 py-1">No one else here yet.</p>
          ) : (
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {online.map((peer) => {
                const isFollowing = followingId === peer.sessionId;
                const label = displayLabel(peer.name);
                const onSamePage = journeyIdsMatch(peer.journeyId, journeyId);
                return (
                  <button
                    key={peer.sessionId}
                    type="button"
                    onClick={() => presenceApi?.toggleFollow?.(peer.sessionId)}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                      isFollowing ? 'bg-brand/10 text-brand' : 'hover:bg-cream'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: peer.color }}>
                      {label[0].toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium truncate block">{label}</span>
                      {peer.journeyTitle && (
                        <span className={`text-[9px] truncate block ${onSamePage ? 'text-emerald-700' : 'text-ink-muted'}`}>
                          {onSamePage ? 'On this page' : peer.journeyTitle}
                        </span>
                      )}
                    </span>
                    {peer.mode === 'edit' && <span className="text-[8px] text-ink-muted shrink-0">editing</span>}
                    {isFollowing ? <EyeOff className="w-3.5 h-3.5 opacity-60 shrink-0" /> : <Eye className="w-3.5 h-3.5 opacity-40 shrink-0" />}
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
