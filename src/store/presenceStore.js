import { create } from 'zustand';

export const usePresenceStore = create((set, get) => ({
  peers: [],
  self: null,
  followingId: null,
  isLive: false,
  connected: false,
  remoteReady: false,
  remoteMode: 'none',
  /** Viewport waiting for canvas applyViewport (cross-page / loading) */
  pendingFollowViewport: null,
  /** Set by canvas — applies React Flow viewport when following */
  applyViewport: null,
  setPresence: ({ peers, self }) => set({ peers, self }),
  setFollowingId: (followingId) => set({ followingId }),
  setLive: (isLive) => set({ isLive }),
  setConnected: (connected) => set({ connected }),
  setRemoteStatus: (remoteMode, remoteReady) => set({ remoteMode, remoteReady }),
  setPendingFollowViewport: (pendingFollowViewport) => set({ pendingFollowViewport }),
  clearPendingFollowViewport: () => set({ pendingFollowViewport: null }),
  setApplyViewport: (applyViewport) => {
    set({ applyViewport });
    const pending = get().pendingFollowViewport;
    if (applyViewport && pending) {
      applyViewport(pending, { immediate: true });
      set({ pendingFollowViewport: null });
    }
  },
  queueFollowViewport: (viewport) => {
    if (!viewport) return;
    const apply = get().applyViewport;
    if (apply) {
      apply(viewport, { immediate: true });
      set({ pendingFollowViewport: null });
    } else {
      set({ pendingFollowViewport: viewport });
    }
  },
  getFollowedPeer: () => {
    const { followingId, peers } = get();
    if (!followingId) return null;
    return peers.find((p) => p.sessionId === followingId) || null;
  },
}));
