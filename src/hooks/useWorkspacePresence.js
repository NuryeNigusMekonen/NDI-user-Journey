import { useCallback, useEffect, useRef } from 'react';
import { PresenceService } from '../services/PresenceService';
import { isSupabaseConfigured } from '../supabase/client';
import { journeyIdsMatch } from '../lib/journeyMatch';
import { usePresenceStore } from '../store/presenceStore';
import { useWorkspaceStore } from '../store/workspaceStore';

let presenceBooted = false;

function bootPresence() {
  if (presenceBooted) return PresenceService.get();
  presenceBooted = true;
  const service = PresenceService.get();
  service.connect().catch((err) => {
    console.error('[presence] boot failed:', err);
  });
  return service;
}

/**
 * App-level presence — connects once, roster updates, cross-page follow navigation.
 */
export function useWorkspacePresence({ journeyId, journeyTitle }) {
  const journeyRef = useRef({ journeyId, journeyTitle });
  const syncFollowedPeerRef = useRef(null);

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
    const onTargetPage = !target || journeyIdsMatch(target, current);

    if (!onTargetPage) {
      if (followed.viewport) usePresenceStore.getState().setPendingFollowViewport(followed.viewport);
      navigateToPeer(target);
      return;
    }

    if (followed.viewport) usePresenceStore.getState().queueFollowViewport(followed.viewport);
  }, [navigateToPeer]);

  syncFollowedPeerRef.current = syncFollowedPeer;

  useEffect(() => {
    const service = bootPresence();

    usePresenceStore.getState().setLive(
      isSupabaseConfigured || typeof BroadcastChannel !== 'undefined',
    );
    usePresenceStore.getState().setConnected(true);

    const followingRef = { current: usePresenceStore.getState().followingId };
    const unsubFollow = usePresenceStore.subscribe((s) => {
      followingRef.current = s.followingId;
    });

    const unsub = service.subscribe((nextPeers, me) => {
      usePresenceStore.getState().setPresence({ peers: nextPeers, self: me });
      const target = followingRef.current;
      if (!target) return;
      const followed = nextPeers.find((p) => p.sessionId === target);
      if (followed) syncFollowedPeerRef.current?.(followed);
    });

    service.track({
      journeyId: journeyRef.current.journeyId,
      journeyTitle: journeyRef.current.journeyTitle,
    });
    service.refresh();

    return () => {
      unsub();
      unsubFollow();
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
    const current = usePresenceStore.getState().followingId;
    if (current === sessionId) stopFollowing();
    else startFollowing(sessionId);
  }, [startFollowing, stopFollowing]);

  const onNameChange = useCallback((name) => {
    PresenceService.get().setName(name);
  }, []);

  return { toggleFollow, onNameChange };
}
