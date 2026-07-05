import { useCallback, useEffect, useRef, useState } from 'react';
import { PresenceService } from '../services/PresenceService';
import { isSupabaseConfigured } from '../supabase/client';

const FOLLOW_SUPPRESS_MS = 400;

export function usePresence(journeyId, { setViewport, getViewport }) {
  const [peers, setPeers] = useState([]);
  const [self, setSelf] = useState(null);
  const [followingId, setFollowingId] = useState(null);
  const followingRef = useRef(null);
  const suppressBroadcast = useRef(false);
  const suppressTimer = useRef(null);

  useEffect(() => {
    followingRef.current = followingId;
  }, [followingId]);

  const applyFollowedViewport = useCallback((vp) => {
    if (!vp || !setViewport) return;
    suppressBroadcast.current = true;
    if (suppressTimer.current) clearTimeout(suppressTimer.current);
    setViewport(vp, { duration: 180 });
    suppressTimer.current = setTimeout(() => {
      suppressBroadcast.current = false;
    }, FOLLOW_SUPPRESS_MS);
  }, [setViewport]);

  useEffect(() => {
    const service = PresenceService.get(journeyId);
    let mounted = true;

    service.connect().then(() => {
      if (!mounted) return;
      const vp = getViewport?.();
      if (vp) service.track({ viewport: vp });

      service.subscribe((nextPeers, me) => {
        setPeers(nextPeers);
        setSelf(me);

        const target = followingRef.current;
        if (!target) return;
        const followed = nextPeers.find((p) => p.sessionId === target);
        if (followed?.viewport) applyFollowedViewport(followed.viewport);
      });
    });

    return () => {
      mounted = false;
      if (suppressTimer.current) clearTimeout(suppressTimer.current);
      service.destroy();
    };
  }, [journeyId, getViewport, applyFollowedViewport]);

  const broadcastViewport = useCallback((vp) => {
    if (suppressBroadcast.current || followingRef.current) return;
    if (!vp) return;
    PresenceService.get(journeyId).track({ viewport: vp });
  }, [journeyId]);

  const broadcastCursor = useCallback((cursor) => {
    PresenceService.get(journeyId).track({ cursor });
  }, [journeyId]);

  const broadcastFollowing = useCallback((following) => {
    PresenceService.get(journeyId).track({ following });
  }, [journeyId]);

  const startFollowing = useCallback((sessionId) => {
    setFollowingId(sessionId);
    broadcastFollowing(sessionId);
    const peer = peers.find((p) => p.sessionId === sessionId);
    if (peer?.viewport) applyFollowedViewport(peer.viewport);
  }, [peers, broadcastFollowing, applyFollowedViewport]);

  const stopFollowing = useCallback(() => {
    setFollowingId(null);
    broadcastFollowing(null);
  }, [broadcastFollowing]);

  const toggleFollow = useCallback((sessionId) => {
    if (followingId === sessionId) stopFollowing();
    else startFollowing(sessionId);
  }, [followingId, startFollowing, stopFollowing]);

  return {
    peers,
    self,
    followingId,
    startFollowing,
    stopFollowing,
    toggleFollow,
    broadcastViewport,
    broadcastCursor,
    isLive: isSupabaseConfigured || typeof BroadcastChannel !== 'undefined',
  };
}
