import { supabase } from '../supabase/client';

const HEARTBEAT_MS = 3000;
const STALE_MS = 20000;

function rowToPeer(row) {
  return {
    sessionId: row.session_id,
    name: row.name,
    color: row.color,
    journeyId: row.journey_id,
    journeyTitle: row.journey_title,
    mode: row.mode,
    following: row.following,
    online_at: row.last_seen,
  };
}

/**
 * Cross-browser presence via Postgres heartbeat + Realtime CDC.
 * Same pattern as production collab tools when WebSocket presence alone is unreliable.
 */
export class RemotePresenceSync {
  constructor({ sessionId, getPayload, onPeers, onStatus }) {
    this.sessionId = sessionId;
    this.getPayload = getPayload;
    this.onPeers = onPeers;
    this.onStatus = onStatus;
    this.heartbeatTimer = null;
    this.pollTimer = null;
    this.channel = null;
    this.active = false;
    this.tableMissing = false;
  }

  async start() {
    if (this.active) return;
    this.active = true;
    this.onStatus?.('connecting');

    const ok = await this.heartbeat();
    if (!ok && this.tableMissing) {
      this.onStatus?.('unavailable');
      return false;
    }

    await this.loadPeers();

    this.heartbeatTimer = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
    this.pollTimer = setInterval(() => this.loadPeers(), HEARTBEAT_MS);

    this.channel = supabase
      .channel('workspace-presence-cdc')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspace_presence' },
        () => { this.loadPeers(); },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') this.onStatus?.('connected');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') this.onStatus?.('error');
      });

    return true;
  }

  async heartbeat() {
    if (!this.active) return true;
    const p = this.getPayload();
    const row = {
      session_id: this.sessionId,
      name: p.name || 'Guest',
      color: p.color,
      journey_id: p.journeyId || null,
      journey_title: p.journeyTitle || null,
      mode: p.mode || 'view',
      following: p.following || null,
      last_seen: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('workspace_presence')
      .upsert(row, { onConflict: 'session_id' });

    if (error) {
      if (/workspace_presence|schema cache|relation/i.test(error.message || '')) {
        this.tableMissing = true;
        console.warn('[presence] workspace_presence table missing — run supabase/schema.sql');
      }
      return false;
    }
    return true;
  }

  async loadPeers() {
    if (!this.active || this.tableMissing) return;
    const since = new Date(Date.now() - STALE_MS).toISOString();
    const { data, error } = await supabase
      .from('workspace_presence')
      .select('session_id, name, color, journey_id, journey_title, mode, following, last_seen')
      .gt('last_seen', since);

    if (error) {
      if (/workspace_presence|schema cache|relation/i.test(error.message || '')) {
        this.tableMissing = true;
        this.onStatus?.('unavailable');
      }
      return;
    }

    const peers = (data || [])
      .filter((row) => row.session_id !== this.sessionId)
      .map(rowToPeer);
    this.onPeers(peers);
    this.onStatus?.('connected');
  }

  async stop() {
    this.active = false;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
    if (!this.tableMissing) {
      await supabase.from('workspace_presence').delete().eq('session_id', this.sessionId);
    }
  }
}
