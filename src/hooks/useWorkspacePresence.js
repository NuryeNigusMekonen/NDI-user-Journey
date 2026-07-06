import { useCallback, useEffect, useRef } from 'react';
import { PresenceService } from '../services/PresenceService';
import { isSupabaseConfigured } from '../supabase/client';
import { journeyIdsMatch } from '../lib/journeyMatch';
import { usePresenceStore } from '../store/presenceStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export function useWorkspacePresence({ journeyId, journeyTitle }) {
  const journeyRef = useRef({ journeyId, journeyTitle });
  const syncRef = useRef(null);

  useEffect(() => {
    journeyRef.current = { journeyId, journeyTitle };
    PresenceService.get().track({ journeyId, journeyTitle });
  }, [journeyId, journeyTitle]);

  const navigateToPeer = useCallback((targetJourneyId) => {
    if (!targetJourneyId) return;
    if (journeyIdsMatch(targetJourneyId, journeyRef.current.journeyId)) return;
    useWorkspaceStore.getState().navigation?.goToJourneyId?.(targetJourneyId);
  }, []);

  const syncFollowedPeer = useCallback((followed) => {
    if (!followed) return;
    const current = journeyRef.current.journeyId;
    const target = followed.journeyId;
    const onPage = !target || journeyIdsMatch(target, current);

    if (!onPage) {
      if (followed.viewport) usePresenceStore.getState().setPendingFollowViewport(followed.viewport);
      navigateToPeer(target);
      return;
    }
    if (followed.viewport) usePresenceStore.getState().queueFollowViewport(followed.viewport);
  }, [navigateToPeer]);

  syncRef.current = syncFollowedPeer;

  useEffect(() => {
    const service = PresenceService.get();

    usePresenceStore.getState().setLive(isSupabaseConfigured);

    service.connect().catch((err) => console.error('[presence]', err));

    const followingRef = { current: usePresenceStore.getState().followingId };
    const unsubFollow = usePresenceStore.subscribe((s) => { followingRef.current = s.followingId; });

    const unsubStatus = service.onStatus((mode, ready) => {
      usePresenceStore.getState().setRemoteStatus(mode, ready);
      usePresenceStore.getState().setConnected(ready || mode === 'db' || mode === 'realtime');
    });

    const unsub = service.subscribe((peers, self) => {
      usePresenceStore.getState().setPresence({ peers, self });
      const target = followingRef.current;
      if (!target) return;
      const followed = peers.find((p) => p.sessionId === target);
      if (followed) syncRef.current?.(followed);
    });

    service.track({
      journeyId: journeyRef.current.journeyId,
      journeyTitle: journeyRef.current.journeyTitle,
    });
    service.refresh();

    const poll = setInterval(() => service.refresh(), 2500);

    return () => {
      unsub();
      unsubStatus();
      unsubFollow();
      clearInterval(poll);
    };
  }, []);

  const startFollowing = useCallback((sessionId) => {
    const peer = usePresenceStore.getState().peers.find((p) => p.sessionId === sessionId);
    usePresenceStore.getState().setFollowingId(sessionId);
    PresenceService.get().track({ following: sessionId });
    if (peer) syncFollowedPeer(peer);
  }, [syncFollowedPeer]);

  const stopFollowing = useCallback(() => {
    usePresenceStore.getState().setFollowingId(null);
    usePresenceStore.getState().clearPendingFollowViewport();
    PresenceService.get().track({ following: null });
  }, []);

  const toggleFollow = useCallback((sessionId) => {
    const cur = usePresenceStore.getState().followingId;
    if (cur === sessionId) stopFollowing();
    else startFollowing(sessionId);
  }, [startFollowing, stopFollowing]);

  const onNameChange = useCallback((name) => {
    PresenceService.get().setName(name);
  }, []);

  return { toggleFollow, onNameChange };
}
