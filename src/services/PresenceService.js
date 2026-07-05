import { supabase, isSupabaseConfigured } from '../supabase/client';
import { getSessionId, ensureDisplayName, colorForSession, displayLabel } from '../lib/guestIdentity';

const VIEWPORT_THROTTLE_MS = 120;
const CURSOR_THROTTLE_MS = 80;
const STALE_MS = 45000;

class LocalPresenceBus {
  constructor(journeyId) {
    this.journeyId = journeyId;
    this.channel = new BroadcastChannel(`compass-presence-${journeyId}`);
    this.listeners = new Set();
    this.peers = new Map();
    this.sessionId = getSessionId();
    this.name = displayLabel(ensureDisplayName());
    this.color = colorForSession(this.sessionId);
    this.lastPayload = null;

    this.channel.onmessage = (e) => {
      if (e.data?.sessionId === this.sessionId) return;
      if (e.data?.type === 'leave') {
        this.peers.delete(e.data.sessionId);
      } else if (e.data?.type === 'presence') {
        this.peers.set(e.data.sessionId, e.data.payload);
      }
      this.emit();
    };

    this.heartbeat = setInterval(() => {
      if (this.lastPayload) {
        this.channel.postMessage({ type: 'presence', sessionId: this.sessionId, payload: this.lastPayload });
      }
    }, 2000);
  }

  pruneStale() {
    const now = Date.now();
    for (const [id, p] of this.peers) {
      if (now - (p.updatedAt || 0) > STALE_MS) this.peers.delete(id);
    }
  }

  emit() {
    this.pruneStale();
    const peers = [...this.peers.values()].filter((p) => p.sessionId !== this.sessionId);
    this.listeners.forEach((fn) => fn(peers));
  }

  track(payload) {
    this.lastPayload = {
      sessionId: this.sessionId,
      name: this.name,
      color: this.color,
      ...payload,
      updatedAt: Date.now(),
    };
    this.channel.postMessage({ type: 'presence', sessionId: this.sessionId, payload: this.lastPayload });
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn([...this.peers.values()].filter((p) => p.sessionId !== this.sessionId));
    return () => this.listeners.delete(fn);
  }

  destroy() {
    this.channel.postMessage({ type: 'leave', sessionId: this.sessionId });
    clearInterval(this.heartbeat);
    this.channel.close();
    this.listeners.clear();
    this.peers.clear();
  }
}

export class PresenceService {
  static instances = new Map();

  static get(journeyId) {
    if (!PresenceService.instances.has(journeyId)) {
      PresenceService.instances.set(journeyId, new PresenceService(journeyId));
    }
    return PresenceService.instances.get(journeyId);
  }

  constructor(journeyId) {
    this.journeyId = journeyId;
    this.sessionId = getSessionId();
    this.name = displayLabel(ensureDisplayName());
    this.color = colorForSession(this.sessionId);
    this.listeners = new Set();
    this.peers = [];
    this.pending = {};
    this.channel = null;
    this.localBus = null;
    this.usingSupabase = false;
    this.connected = false;
    this.lastViewportTrack = 0;
    this.lastCursorTrack = 0;
    this.heartbeat = null;
  }

  async connect() {
    if (this.connected) return;

    if (isSupabaseConfigured && supabase) {
      this.usingSupabase = true;
      this.channel = supabase.channel(`presence:${this.journeyId}`, {
        config: { presence: { key: this.sessionId } },
      });

      this.channel
        .on('presence', { event: 'sync' }, () => this.syncPeers())
        .on('presence', { event: 'join' }, () => this.syncPeers())
        .on('presence', { event: 'leave' }, () => this.syncPeers());

      await new Promise((resolve) => {
        this.channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await this.channel.track(this.basePayload());
            this.connected = true;
            this.startHeartbeat();
            resolve();
          }
        });
      });
      return;
    }

    this.localBus = new LocalPresenceBus(this.journeyId);
    this.localBus.subscribe((peers) => {
      this.peers = peers;
      this.emit();
    });
    this.connected = true;
    this.track({});
  }

  startHeartbeat() {
    if (this.heartbeat) return;
    this.heartbeat = setInterval(() => {
      if (this.channel) this.channel.track(this.basePayload(this.pending));
    }, 5000);
  }

  basePayload(extra = {}) {
    return {
      sessionId: this.sessionId,
      name: this.name,
      color: this.color,
      mode: 'view',
      viewport: null,
      cursor: null,
      following: null,
      ...extra,
      updatedAt: Date.now(),
    };
  }

  syncPeers() {
    if (!this.channel) return;
    const state = this.channel.presenceState();
    const now = Date.now();
    const peers = [];
    const seen = new Set();

    Object.entries(state).forEach(([key, entries]) => {
      if (key === this.sessionId) return;
      (entries || []).forEach((entry) => {
        const id = entry.sessionId || key;
        if (seen.has(id)) return;
        if (now - (entry.updatedAt || 0) > STALE_MS) return;
        seen.add(id);
        peers.push({ ...entry, sessionId: id });
      });
    });

    this.peers = peers;
    this.emit();
  }

  emit() {
    this.listeners.forEach((fn) => fn(this.peers, this.getSelf()));
  }

  getSelf() {
    return this.basePayload(this.pending);
  }

  track(payload) {
    this.pending = { ...this.pending, ...payload, updatedAt: Date.now() };
    const now = Date.now();

    if (payload?.viewport != null) {
      if (now - this.lastViewportTrack < VIEWPORT_THROTTLE_MS) return;
      this.lastViewportTrack = now;
    } else if (payload?.cursor != null) {
      if (now - this.lastCursorTrack < CURSOR_THROTTLE_MS) return;
      this.lastCursorTrack = now;
    }

    const full = this.basePayload(this.pending);

    if (this.usingSupabase && this.channel) {
      this.channel.track(full);
    } else if (this.localBus) {
      this.localBus.track(full);
    }
  }

  setName(name) {
    this.name = displayLabel(name);
    if (this.localBus) this.localBus.name = this.name;
    this.track({ name: this.name });
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.peers, this.getSelf());
    return () => this.listeners.delete(fn);
  }

  destroy() {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    if (this.channel) {
      supabase?.removeChannel(this.channel);
      this.channel = null;
    }
    if (this.localBus) {
      this.localBus.destroy();
      this.localBus = null;
    }
    this.listeners.clear();
    this.connected = false;
    PresenceService.instances.delete(this.journeyId);
  }
}
