import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const memoryStore = new Map();

export const BoardService = {
  async load(journeyId) {
    if (!isSupabaseConfigured) {
      const saved = memoryStore.get(journeyId);
      if (!saved) return null;
      return {
        nodes: saved.nodes,
        edges: saved.edges,
        strokes: saved.strokes || [],
        savedBy: saved.savedBy,
        updatedAt: saved.updatedAt,
      };
    }

    const { data, error } = await supabase
      .from('journey_boards')
      .select('nodes, edges, strokes, saved_by, updated_at')
      .eq('journey_id', journeyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      nodes: data.nodes,
      edges: data.edges,
      strokes: data.strokes || [],
      savedBy: data.saved_by,
      updatedAt: data.updated_at,
    };
  },

  async save(journeyId, boardState, savedBy) {
    const updatedAt = new Date().toISOString();
    const payload = {
      nodes: boardState.nodes,
      edges: boardState.edges,
      strokes: boardState.strokes || [],
      savedBy,
      updatedAt,
    };

    if (!isSupabaseConfigured) {
      memoryStore.set(journeyId, payload);
      return payload;
    }

    const { error } = await supabase
      .from('journey_boards')
      .upsert(
        {
          journey_id: journeyId,
          nodes: payload.nodes,
          edges: payload.edges,
          strokes: payload.strokes,
          saved_by: savedBy || null,
          updated_at: updatedAt,
        },
        { onConflict: 'journey_id' },
      );

    if (error) throw error;
    return payload;
  },

  subscribe(journeyId, onUpdate) {
    if (!isSupabaseConfigured) return () => {};

    const channel = supabase
      .channel(`board:${journeyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'journey_boards',
          filter: `journey_id=eq.${journeyId}`,
        },
        (payload) => onUpdate(payload.new),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
