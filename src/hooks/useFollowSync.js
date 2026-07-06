import { useCallback, useEffect, useRef } from 'react';
import { PresenceService } from '../services/PresenceService';
import { journeyIdsMatch } from '../lib/journeyMatch';
import { usePresenceStore } from '../store/presenceStore';
import { useDiagramStore } from '../store/diagramStore';

const FOLLOW_SUPPRESS_MS = 500;
const VIEWPORT_EPSILON = 0.5;

function viewportChanged(a, b) {
  if (!a || !b) return true;
  return Math.abs(a.x - b.x) > VIEWPORT_EPSILON
    || Math.abs(a.y - b.y) > VIEWPORT_EPSILON
    || Math.abs(a.zoom - b.zoom) > 0.01;
}

function followViewportKey(peer, journeyId) {
  if (!peer?.viewport) return null;
  if (peer.journeyId && !journeyIdsMatch(peer.journeyId, journeyId)) return null;
  const { x, y, zoom } = peer.viewport;
  return `${peer.journeyId || ''}|${x}|${y}|${zoom}`;
}

/**
 * Canvas follow sync — realtime viewport mirror for same or different journey pages.
 * Navigation is handled at app level; this applies viewport once on the right board.
 */
export function useFollowSync({ journeyId, setViewport, getViewport }) {
  const suppressBroadcast = useRef(false);
  const suppressTimer = useRef(null);
  const lastApplied = useRef(null);
  const loading = useDiagramStore((s) => s.loading);
  const followingId = usePresenceStore((s) => s.followingId);
  const followedPeer = usePresenceStore((s) => (
    s.followingId ? s.peers.find((p) => p.sessionId === s.followingId) : null
  ));
  const followKey = followingId ? followViewportKey(followedPeer, journeyId) : null;

  const applyFollowedViewport = useCallback((vp, { immediate = false } = {}) => {
    if (!vp || !setViewport) return;
    if (!viewportChanged(lastApplied.current, vp)) return;

    lastApplied.current = vp;
    suppressBroadcast.current = true;
    if (suppressTimer.current) clearTimeout(suppressTimer.current);
    setViewport(vp, { duration: immediate ? 0 : 150 });
    suppressTimer.current = setTimeout(() => {
      suppressBroadcast.current = false;
    }, FOLLOW_SUPPRESS_MS);
  }, [setViewport]);

  const flushPendingViewport = useCallback(() => {
    const store = usePresenceStore.getState();
    const pending = store.pendingFollowViewport;
    if (pending) {
      applyFollowedViewport(pending, { immediate: true });
      store.clearPendingFollowViewport();
      return;
    }
    const peer = store.getFollowedPeer();
    if (!peer?.viewport) return;
    if (peer.journeyId && !journeyIdsMatch(peer.journeyId, journeyId)) return;
    applyFollowedViewport(peer.viewport, { immediate: true });
  }, [journeyId, applyFollowedViewport]);

  useEffect(() => {
    usePresenceStore.getState().setApplyViewport(applyFollowedViewport);
    flushPendingViewport();
    return () => usePresenceStore.getState().setApplyViewport(null);
  }, [applyFollowedViewport, flushPendingViewport]);

  useEffect(() => {
    if (!followingId || !followKey || !followedPeer?.viewport) return;
    if (followedPeer.journeyId && !journeyIdsMatch(followedPeer.journeyId, journeyId)) return;
    if (loading) return;
    applyFollowedViewport(followedPeer.viewport);
  }, [followKey, followingId, journeyId, loading, followedPeer, applyFollowedViewport]);

  const prevLoading = useRef(loading);
  useEffect(() => {
    const wasLoading = prevLoading.current;
    prevLoading.current = loading;
    if (wasLoading && !loading && followingId) {
      const t1 = setTimeout(flushPendingViewport, 50);
      const t2 = setTimeout(flushPendingViewport, 250);
      const t3 = setTimeout(flushPendingViewport, 600);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    return undefined;
  }, [loading, followingId, flushPendingViewport]);

  useEffect(() => {
    lastApplied.current = null;
  }, [journeyId, followingId]);

  useEffect(() => {
    const service = PresenceService.get();
    const vp = getViewport?.();
    service.track({ journeyId, ...(vp ? { viewport: vp } : {}) });
  }, [journeyId, getViewport]);

  const broadcastViewport = useCallback((vp) => {
    if (suppressBroadcast.current || usePresenceStore.getState().followingId) return;
    if (!vp) return;
    PresenceService.get().broadcastViewport(vp);
  }, []);

  const broadcastCursor = useCallback((cursor) => {
    PresenceService.get().track({ cursor });
  }, []);

  return { broadcastViewport, broadcastCursor, flushPendingViewport };
}
