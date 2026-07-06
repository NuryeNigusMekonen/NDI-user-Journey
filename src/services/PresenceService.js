import { supabase, isSupabaseConfigured } from '../supabase/client';
import { getSessionId, ensureDisplayName, colorForSession, displayLabel } from '../lib/guestIdentity';
import { WORKSPACE_PRESENCE_ID } from '../lib/presenceScope';
import { RemotePresenceSync } from '../presence/RemotePresenceSync';

const BROADCAST_ROOM = `room:${WORKSPACE_PRESENCE_ID}`;
const ROSTER_KEY = 'compass:presence-roster';
const ROSTER_HEARTBEAT_MS = 2000;
const ROSTER_STALE_MS = 8000;
const VIEWPORT_BROADCAST_MS = 100;

function mergePeers(...lists) {
  const map = new Map();
  for (const list of lists) {
    for (const p of list) {
      if (p?.sessionId) map.set(p.sessionId, p);
    }
  }
  return [...map.values()];
}

class TabRoster {
  constructor(sessionId, onUpdate) {
    this.sessionId = sessionId;
    this.onUpdate = onUpdate;
    this.onStorage = (e) => { if (e.key === ROSTER_KEY) this.read(); };
    window.addEventListener('storage', this.onStorage);
    this.timer = setInterval(() => this.read(), ROSTER_HEARTBEAT_MS);
  }

  read() {
    try {
      const raw = localStorage.getItem(ROSTER_KEY);
      if (!raw) { this.onUpdate([]); return; }
      const roster = JSON.parse(raw);
      const now = Date.now();
      this.onUpdate(Object.values(roster).filter(
        (p) => p.sessionId !== this.sessionId && now - (p.lastSeen || 0) < ROSTER_STALE_MS,
      ));
    } catch { this.onUpdate([]); }
  }

  write(payload) {
    try {
      const roster = JSON.parse(localStorage.getItem(ROSTER_KEY) || '{}');
      const now = Date.now();
      roster[this.sessionId] = { ...payload, sessionId: this.sessionId, lastSeen: now };
      for (const [id, p] of Object.entries(roster)) {
        if (now - (p.lastSeen || 0) > ROSTER_STALE_MS) delete roster[id];
      }
      localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
      this.read();
    } catch { /* private browsing */ }
  }

  leave() {
    try {
      const roster = JSON.parse(localStorage.getItem(ROSTER_KEY) || '{}');
      delete roster[this.sessionId];
      localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    } catch { /* ignore */ }
  }

  destroy() {
    this.leave();
    window.removeEventListener('storage', this.onStorage);
    clearInterval(this.timer);
  }
}

function buildRealtimePresence(sessionId, name, color, state) {
  return {
    sessionId,
    name,
    color,
    mode: state.mode || 'view',
    journeyId: state.journeyId || null,
    journeyTitle: state.journeyTitle || null,
    following: state.following || null,
    online_at: new Date().toISOString(),
  };
}

export class PresenceService {
  static instance = null;

  static get() {
    if (!PresenceService.instance) PresenceService.instance = new PresenceService();
    return PresenceService.instance;
  }

  constructor() {
    this.sessionId = getSessionId();
    this.name = displayLabel(ensureDisplayName());
    this.color = colorForSession(this.sessionId);
    this.state = { mode: 'view', journeyId: null, journeyTitle: null, following: null };
    this.viewport = null;
    this.listeners = new Set();
    this.statusListeners = new Set();
    this.remotePeers = [];
    this.bcPeers = [];
    this.storagePeers = [];
    this.peers = [];
    this.bc = null;
    this.tabRoster = null;
    this.remoteDb = null;
    this.broadcastChannel = null;
    this.realtimePresenceChannel = null;
    this.remoteReady = false;
    this.remoteMode = 'none'; // 'db' | 'realtime' | 'none'
    this.connected = false;
    this.lastViewportSent = 0;
    this.realtimeTimer = null;
  }

  onStatus(fn) {
    this.statusListeners.add(fn);
    fn(this.remoteMode, this.remoteReady);
    return () => this.statusListeners.delete(fn);
  }

  emitStatus() {
    this.statusListeners.forEach((fn) => fn(this.remoteMode, this.remoteReady));
  }

  getSelf() {
    return {
      sessionId: this.sessionId,
      name: this.name,
      color: this.color,
      ...this.state,
      viewport: this.viewport,
    };
  }

  publish() {
    this.peers = mergePeers(this.remotePeers, this.bcPeers, this.storagePeers)
      .filter((p) => p.sessionId !== this.sessionId);
    const peers = this.peers;
    const self = this.getSelf();
    this.listeners.forEach((fn) => fn(peers, self));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.peers, this.getSelf());
    return () => this.listeners.delete(fn);
  }

  setupLocalBroadcast() {
    if (this.bc) return;
    try {
      this.bc = new BroadcastChannel(`compass-roster-${WORKSPACE_PRESENCE_ID}`);
      this.bc.onmessage = (e) => {
        const { type, sessionId, payload } = e.data || {};
        if (!sessionId || sessionId === this.sessionId) return;
        if (type === 'roster') {
          this.bcPeers = this.bcPeers.filter((p) => p.sessionId !== sessionId);
          this.bcPeers.push({ ...payload, sessionId });
          this.publish();
        } else if (type === 'leave') {
          this.bcPeers = this.bcPeers.filter((p) => p.sessionId !== sessionId);
          this.publish();
        }
      };
    } catch { /* unsupported */ }
  }

  announceLocal() {
    const payload = this.getSelf();
    this.bc?.postMessage({ type: 'roster', sessionId: this.sessionId, payload });
    this.tabRoster?.write(payload);
  }

  async connect() {
    if (this.connected) {
      this.announceLocal();
      this.pushRemote();
      return;
    }

    this.setupLocalBroadcast();
    this.tabRoster = new TabRoster(this.sessionId, (peers) => {
      this.storagePeers = peers;
      this.publish();
    });

    this.connected = true;
    this.announceLocal();

    if (isSupabaseConfigured && supabase) {
      await this.connectRemote();
    }
  }

  async connectRemote() {
    this.setupBroadcastChannel();

    this.remoteDb = new RemotePresenceSync({
      sessionId: this.sessionId,
      getPayload: () => this.getSelf(),
      onPeers: (peers) => {
        this.remotePeers = peers;
        this.remoteMode = 'db';
        this.remoteReady = true;
        this.emitStatus();
        this.publish();
      },
      onStatus: (status) => {
        if (status === 'connected') {
          this.remoteMode = 'db';
          this.remoteReady = true;
          this.emitStatus();
        }
      },
    });

    const dbOk = await this.remoteDb.start();
    if (!dbOk) {
      this.connectRealtimePresenceFallback();
    }
  }

  connectRealtimePresenceFallback() {
    if (this.realtimePresenceChannel) return;

    const apply = () => {
      const peers = [];
      for (const [key, entries] of Object.entries(this.realtimePresenceChannel.presenceState())) {
        if (key === this.sessionId) continue;
        for (const entry of entries || []) {
          const sessionId = entry.sessionId || key;
          if (sessionId !== this.sessionId) {
            const existing = this.remotePeers.find((p) => p.sessionId === sessionId);
            peers.push({ ...entry, sessionId, viewport: existing?.viewport });
          }
        }
      }
      this.remotePeers = peers;
      this.remoteMode = 'realtime';
      this.remoteReady = true;
      this.emitStatus();
      this.publish();
    };

    this.realtimePresenceChannel = supabase.channel(BROADCAST_ROOM, {
      config: { presence: { key: this.sessionId }, broadcast: { self: false } },
    });

    this.realtimePresenceChannel
      .on('presence', { event: 'sync' }, apply)
      .on('presence', { event: 'join' }, apply)
      .on('presence', { event: 'leave' }, apply)
      .on('broadcast', { event: 'viewport' }, ({ payload }) => {
        if (!payload?.sessionId || payload.sessionId === this.sessionId) return;
        this.remotePeers = this.remotePeers.map((p) => (
          p.sessionId === payload.sessionId ? { ...p, viewport: payload.viewport } : p
        ));
        this.publish();
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (!payload?.sessionId || payload.sessionId === this.sessionId) return;
        this.remotePeers = this.remotePeers.map((p) => (
          p.sessionId === payload.sessionId ? { ...p, cursor: payload.cursor } : p
        ));
        this.publish();
      });

    this.realtimePresenceChannel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return;
      await this.realtimePresenceChannel.track(
        buildRealtimePresence(this.sessionId, this.name, this.color, this.state),
      );
      apply();
      if (!this.realtimeTimer) {
        this.realtimeTimer = setInterval(() => {
          this.realtimePresenceChannel?.track(
            buildRealtimePresence(this.sessionId, this.name, this.color, this.state),
          );
        }, 4000);
      }
    });
  }

  setupBroadcastChannel() {
    if (this.broadcastChannel || this.realtimePresenceChannel) return;

    this.broadcastChannel = supabase.channel(`${BROADCAST_ROOM}:viewport`, {
      config: { broadcast: { self: false } },
    });

    this.broadcastChannel
      .on('broadcast', { event: 'viewport' }, ({ payload }) => {
        if (!payload?.sessionId || payload.sessionId === this.sessionId) return;
        this.remotePeers = this.remotePeers.map((p) => (
          p.sessionId === payload.sessionId ? { ...p, viewport: payload.viewport } : p
        ));
        this.publish();
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (!payload?.sessionId || payload.sessionId === this.sessionId) return;
        this.remotePeers = this.remotePeers.map((p) => (
          p.sessionId === payload.sessionId ? { ...p, cursor: payload.cursor } : p
        ));
        this.publish();
      })
      .subscribe();
  }

  pushRemote() {
    this.remoteDb?.heartbeat();
    if (this.realtimePresenceChannel && this.remoteMode === 'realtime') {
      this.realtimePresenceChannel.track(
        buildRealtimePresence(this.sessionId, this.name, this.color, this.state),
      );
    }
    this.announceLocal();
  }

  broadcastViewport(viewport) {
    this.viewport = viewport;
    const now = Date.now();
    if (now - this.lastViewportSent < VIEWPORT_BROADCAST_MS) return;
    this.lastViewportSent = now;

    const ch = this.broadcastChannel || this.realtimePresenceChannel;
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'viewport',
        payload: { sessionId: this.sessionId, viewport },
      });
    }
  }

  track(payload) {
    if (!payload) return;

    const presenceFields = ['name', 'mode', 'journeyId', 'journeyTitle', 'following'];
    let changed = false;
    for (const k of presenceFields) {
      if (Object.prototype.hasOwnProperty.call(payload, k)) {
        if (k === 'name') this.name = displayLabel(payload.name);
        else this.state[k] = payload[k];
        changed = true;
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'viewport')) {
      this.broadcastViewport(payload.viewport);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'cursor')) {
      const ch = this.broadcastChannel || this.realtimePresenceChannel;
      ch?.send({
        type: 'broadcast',
        event: 'cursor',
        payload: { sessionId: this.sessionId, cursor: payload.cursor },
      });
    }

    if (changed) this.pushRemote();
  }

  setName(name) {
    this.track({ name });
  }

  refresh() {
    this.announceLocal();
    this.remoteDb?.loadPeers();
    this.publish();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    const svc = PresenceService.instance;
    if (!svc) return;
    svc.bc?.postMessage({ type: 'leave', sessionId: svc.sessionId });
    svc.bc?.close();
    svc.tabRoster?.destroy();
    svc.remoteDb?.stop();
    if (svc.broadcastChannel) supabase?.removeChannel(svc.broadcastChannel);
    if (svc.realtimePresenceChannel) supabase?.removeChannel(svc.realtimePresenceChannel);
    if (svc.realtimeTimer) clearInterval(svc.realtimeTimer);
    PresenceService.instance = null;
  });
}
