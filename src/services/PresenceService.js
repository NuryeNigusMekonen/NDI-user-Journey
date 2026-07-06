import { supabase, isSupabaseConfigured } from '../supabase/client';
import { getSessionId, ensureDisplayName, colorForSession, displayLabel } from '../lib/guestIdentity';
import { WORKSPACE_PRESENCE_ID } from '../lib/presenceScope';

const VIEWPORT_THROTTLE_MS = 80;
const CURSOR_THROTTLE_MS = 80;
const STALE_MS = 60000;

class LocalPresenceBus {
  constructor(scopeId, sessionId) {
    this.scopeId = scopeId;
    this.sessionId = sessionId;
    this.channel = new BroadcastChannel(`compass-presence-${scopeId}`);
    this.listeners = new Set();
    this.peers = new Map();
    this.name = displayLabel(ensureDisplayName());
    this.color = colorForSession(sessionId);
    this.lastPayload = null;
    this.closed = false;

    this.channel.onmessage = (e) => {
      if (this.closed) return;
      const { type, sessionId: fromId, payload } = e.data || {};
      if (!fromId || fromId === this.sessionId) return;
      if (type === 'leave') {
        this.peers.delete(fromId);
      } else if (type === 'presence' && payload) {
        this.peers.set(fromId, { ...payload, sessionId: fromId });
      }
      this.notify();
    };

    this.heartbeat = setInterval(() => {
      if (this.lastPayload && !this.closed) {
        this.channel.postMessage({
          type: 'presence',
          sessionId: this.sessionId,
          payload: this.lastPayload,
        });
      }
    }, 2500);
  }

  pruneStale() {
    const now = Date.now();
    for (const [id, p] of this.peers) {
      const ts = p.updatedAt;
      if (typeof ts === 'number' && now - ts > STALE_MS) this.peers.delete(id);
    }
  }

  getPeers() {
    this.pruneStale();
    return [...this.peers.values()].filter((p) => p.sessionId !== this.sessionId);
  }

  notify() {
    const peers = this.getPeers();
    this.listeners.forEach((fn) => fn(peers));
  }

  track(payload) {
    if (this.closed) return;
    this.lastPayload = {
      sessionId: this.sessionId,
      name: this.name,
      color: this.color,
      ...payload,
      updatedAt: Date.now(),
    };
    this.channel.postMessage({
      type: 'presence',
      sessionId: this.sessionId,
      payload: this.lastPayload,
    });
    this.notify();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.getPeers());
    return () => this.listeners.delete(fn);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.channel.postMessage({ type: 'leave', sessionId: this.sessionId });
    } catch { /* ignore */ }
    clearInterval(this.heartbeat);
    this.channel.close();
    this.listeners.clear();
    this.peers.clear();
  }
}

function normalizePeer(entry, fallbackId) {
  const sessionId = entry?.sessionId || fallbackId;
  if (!sessionId) return null;
  return { ...entry, sessionId };
}

export class PresenceService {
  static instance = null;

  static get() {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService(WORKSPACE_PRESENCE_ID);
    }
    return PresenceService.instance;
  }

  constructor(scopeId) {
    this.scopeId = scopeId;
    this.sessionId = getSessionId();
    this.name = displayLabel(ensureDisplayName());
    this.color = colorForSession(this.sessionId);
    this.listeners = new Set();
    this.remotePeers = [];
    this.localPeers = [];
    this.peers = [];
    this.pending = {};
    this.channel = null;
    this.localBus = null;
    this.localUnsub = null;
    this.usingSupabase = false;
    this.connected = false;
    this.supabaseReady = false;
    this.lastViewportTrack = 0;
    this.lastCursorTrack = 0;
    this.heartbeat = null;
    this.viewportFlushTimer = null;
    this.supabaseConnecting = false;
  }

  ensureLocalBus() {
    if (this.localBus) return;
    this.localBus = new LocalPresenceBus(this.scopeId, this.sessionId);
    this.localUnsub = this.localBus.subscribe((peers) => {
      this.localPeers = peers;
      this.publish();
    });
  }

  publish() {
    const byId = new Map();

    for (const raw of this.remotePeers) {
      const p = normalizePeer(raw);
      if (p && p.sessionId !== this.sessionId) byId.set(p.sessionId, p);
    }
    for (const raw of this.localPeers) {
      const p = normalizePeer(raw);
      if (p && p.sessionId !== this.sessionId && !byId.has(p.sessionId)) {
        byId.set(p.sessionId, p);
      }
    }

    this.peers = [...byId.values()];
    this.listeners.forEach((fn) => fn(this.peers, this.getSelf()));
  }

  async connect() {
    if (this.connected) {
      this.announce();
      return;
    }

    this.ensureLocalBus();
    this.connected = true;
    this.announce();

    if (isSupabaseConfigured && supabase && !this.supabaseConnecting) {
      this.connectSupabase();
    }
  }

  announce() {
    const full = this.basePayload(this.pending);
    if (this.localBus) this.localBus.track(full);
    else this.publish();
  }

  async connectSupabase() {
    if (this.supabaseConnecting || this.supabaseReady) return;
    this.supabaseConnecting = true;

    try {
      this.channel = supabase.channel(`presence:${this.scopeId}`, {
        config: { presence: { key: this.sessionId } },
      });

      this.channel
        .on('presence', { event: 'sync' }, () => this.syncRemotePeers())
        .on('presence', { event: 'join' }, () => this.syncRemotePeers())
        .on('presence', { event: 'leave' }, () => this.syncRemotePeers())
        .on('presence', { event: 'update' }, () => this.syncRemotePeers());

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), 8000);
        this.channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timer);
            try {
              await this.channel.track(this.basePayload(this.pending));
              this.usingSupabase = true;
              this.supabaseReady = true;
              this.startHeartbeat();
              this.syncRemotePeers();
              resolve();
            } catch (err) {
              reject(err);
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timer);
            reject(new Error(status));
          }
        });
      });
    } catch (err) {
      console.warn('[presence] remote sync unavailable — local tabs still work:', err?.message || err);
      this.usingSupabase = false;
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    } finally {
      this.supabaseConnecting = false;
    }
  }

  startHeartbeat() {
    if (this.heartbeat) return;
    this.heartbeat = setInterval(() => {
      if (this.channel && this.supabaseReady) {
        this.channel.track(this.basePayload(this.pending));
      }
    }, 4000);
  }

  basePayload(extra = {}) {
    return {
      sessionId: this.sessionId,
      name: this.name,
      color: this.color,
      mode: 'view',
      journeyId: null,
      journeyTitle: null,
      viewport: null,
      cursor: null,
      following: null,
      ...extra,
      updatedAt: Date.now(),
    };
  }

  syncRemotePeers() {
    if (!this.channel) return;
    const state = this.channel.presenceState();
    const now = Date.now();
    const peers = [];
    const seen = new Set();

    Object.entries(state).forEach(([key, entries]) => {
      if (key === this.sessionId) return;
      (entries || []).forEach((entry) => {
        const p = normalizePeer(entry, key);
        if (!p || seen.has(p.sessionId) || p.sessionId === this.sessionId) return;
        const ts = p.updatedAt;
        if (typeof ts === 'number' && now - ts > STALE_MS) return;
        seen.add(p.sessionId);
        peers.push(p);
      });
    });

    this.remotePeers = peers;
    this.publish();
  }

  refresh() {
    if (this.supabaseReady) this.syncRemotePeers();
    if (this.localBus) this.localBus.notify();
    else this.publish();
  }

  getSelf() {
    return this.basePayload(this.pending);
  }

  track(payload) {
    if (!payload) return;
    this.pending = { ...this.pending, ...payload, updatedAt: Date.now() };
    const now = Date.now();

    const isViewport = Object.prototype.hasOwnProperty.call(payload, 'viewport');
    const isCursor = Object.prototype.hasOwnProperty.call(payload, 'cursor');

    if (isViewport && now - this.lastViewportTrack < VIEWPORT_THROTTLE_MS) {
      this.scheduleViewportFlush();
      return;
    }
    if (isCursor && now - this.lastCursorTrack < CURSOR_THROTTLE_MS) return;

    if (isViewport) this.lastViewportTrack = now;
    if (isCursor) this.lastCursorTrack = now;

    this.flushTrack();
  }

  flushTrack() {
    const full = this.basePayload(this.pending);

    if (this.localBus) this.localBus.track(full);

    if (this.supabaseReady && this.channel) {
      Promise.resolve(this.channel.track(full))
        .then(() => this.syncRemotePeers())
        .catch(() => {});
    }
  }

  scheduleViewportFlush() {
    if (this.viewportFlushTimer) return;
    this.viewportFlushTimer = setTimeout(() => {
      this.viewportFlushTimer = null;
      this.lastViewportTrack = Date.now();
      this.flushTrack();
    }, VIEWPORT_THROTTLE_MS);
  }

  setName(name) {
    this.name = displayLabel(name);
    if (this.localBus) this.localBus.name = this.name;
    this.pending = { ...this.pending, name: this.name, updatedAt: Date.now() };
    this.flushTrack();
    this.publish();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.peers, this.getSelf());
    return () => this.listeners.delete(fn);
  }

  shutdown() {
    if (this.viewportFlushTimer) clearTimeout(this.viewportFlushTimer);
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.localUnsub) this.localUnsub();
    if (this.localBus) this.localBus.close();
    if (this.channel) supabase?.removeChannel(this.channel);
    this.listeners.clear();
    this.remotePeers = [];
    this.localPeers = [];
    this.peers = [];
    this.connected = false;
    this.supabaseReady = false;
    this.usingSupabase = false;
    this.supabaseConnecting = false;
    PresenceService.instance = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => PresenceService.instance?.shutdown());
}
