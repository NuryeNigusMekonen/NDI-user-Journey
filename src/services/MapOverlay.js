import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Edits to the Full Journey map, stored as an OVERLAY on the generated data.
 *
 * The map's value is that its numbers are read from the repo — test counts from backend/tests/,
 * rules from the Technical Brief, verdicts from the manual run log. Storing edits as a full
 * replacement would freeze all of that: a node nobody touched would stop tracking the code, and a
 * stale test count would look as authoritative as a live one.
 *
 * So an overlay stores ONLY the fields someone actually changed, per node. Everything else keeps
 * flowing from src/data/unifiedMap.js. An edited field is marked in the UI, so a reader can tell
 * a hand-written figure from a generated one — which is the whole point of the map.
 *
 * Shape: { nodes: { [nodeId]: { title?, sub?, behavior?, tested?, warn?, col?, cy? } },
 *          updatedBy, updatedAt }
 */
const KEY = 'unified-map-overlay';
let memory = null;                       // fallback when Supabase is not configured

export const MapOverlay = {
  async load() {
    if (!isSupabaseConfigured) return memory;
    const { data, error } = await supabase
      .from('journey_boards')
      .select('nodes, saved_by, updated_at')
      .eq('journey_id', KEY)
      .maybeSingle();
    // A missing overlay is the normal first-run state, not an error worth surfacing.
    if (error || !data) return null;
    return { nodes: data.nodes || {}, updatedBy: data.saved_by, updatedAt: data.updated_at };
  },

  async save(nodes, savedBy) {
    const payload = { nodes, updatedBy: savedBy, updatedAt: new Date().toISOString() };
    if (!isSupabaseConfigured) { memory = payload; return payload; }
    const { error } = await supabase.from('journey_boards').upsert({
      journey_id: KEY,
      nodes,
      edges: [],                         // the overlay does not redraw connectors
      strokes: [],
      saved_by: savedBy || null,
      updated_at: payload.updatedAt,
    }, { onConflict: 'journey_id' });
    if (error) throw error;
    return payload;
  },
};

/** Merge an overlay over the generated nodes. Only overlaid keys win; the rest stay generated,
 *  and `edited` lists which fields were overridden so the UI can mark them. */
export function applyOverlay(nodes, overlay) {
  if (!overlay?.nodes) return nodes;
  return nodes.map((n) => {
    const patch = overlay.nodes[n.id];
    if (!patch) return n;
    const edited = Object.keys(patch).filter((k) => patch[k] !== undefined && patch[k] !== null);
    return edited.length ? { ...n, ...patch, edited } : n;
  });
}
