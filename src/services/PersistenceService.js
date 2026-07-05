import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  toNodeRow, fromNodeRow, toEdgeRow, fromEdgeRow,
  toCommentRow, fromCommentRow, toAnnotationRow, fromAnnotationRow,
} from '../supabase/mappers';
import { SAVE_CODE } from '../types/diagram';
import { beginSaveLock, endSaveLock, pauseCommentSync, markBoardSaveComplete } from '../lib/commentSyncGuard';

const memory = new Map();
const saveQueues = new Map();

function dedupeByKey(rows, key) {
  const map = new Map();
  rows.forEach((row) => {
    if (row[key]) map.set(row[key], row);
  });
  return [...map.values()];
}

async function runSerialized(journeyId, fn) {
  const prev = saveQueues.get(journeyId) || Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  saveQueues.set(journeyId, next);
  try {
    return await next;
  } finally {
    if (saveQueues.get(journeyId) === next) saveQueues.delete(journeyId);
  }
}

async function deleteWhere(table, boardId) {
  const { error } = await supabase.from(table).delete().eq('board_id', boardId);
  if (error) throw error;
}

async function upsertRows(table, rows, onConflict) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw error;
}

async function getOrCreateBoardId(journeyId, savedBy, viewport, edgeStyle) {
  const { data: existing, error: findErr } = await supabase
    .from('boards')
    .select('id')
    .eq('journey_id', journeyId)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing?.id) return existing.id;

  const { data, error } = await supabase.from('boards').insert({
    journey_id: journeyId,
    saved_by: savedBy,
    viewport,
    edge_style: edgeStyle,
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

/** Write board metadata last so realtime listeners see nodes/edges already committed */
async function finalizeBoard(boardId, { savedBy, viewport, edgeStyle, mermaidSource }) {
  const updatedAt = new Date().toISOString();
  const base = {
    saved_by: savedBy,
    viewport,
    edge_style: edgeStyle,
    updated_at: updatedAt,
  };

  const withMermaid = mermaidSource
    ? { ...base, mermaid_source: mermaidSource }
    : base;

  let { error } = await supabase.from('boards').update(withMermaid).eq('id', boardId);

  // Graceful fallback when migration for mermaid_source has not been applied yet
  if (error && mermaidSource && /mermaid_source/i.test(error.message || '')) {
    console.warn('[PersistenceService] boards.mermaid_source column missing — run supabase/schema.sql migration');
    ({ error } = await supabase.from('boards').update(base).eq('id', boardId));
  }

  if (error) throw error;
  return updatedAt;
}

async function syncDiagramRows(boardId, nodes, edges) {
  const nodeRows = dedupeByKey((nodes || []).map((n) => toNodeRow(boardId, n)), 'rf_id');
  const nodeIds = new Set(nodeRows.map((r) => r.rf_id));
  const edgeRows = dedupeByKey((edges || []).map((e) => toEdgeRow(boardId, e)), 'rf_id');
  const edgeIds = new Set(edgeRows.map((r) => r.rf_id));

  const [existingNodes, existingEdges] = await Promise.all([
    supabase.from('nodes').select('rf_id').eq('board_id', boardId),
    supabase.from('edges').select('rf_id').eq('board_id', boardId),
  ]);

  if (existingNodes.error) throw existingNodes.error;
  if (existingEdges.error) throw existingEdges.error;

  const staleNodeIds = (existingNodes.data || []).map((r) => r.rf_id).filter((id) => !nodeIds.has(id));
  const staleEdgeIds = (existingEdges.data || []).map((r) => r.rf_id).filter((id) => !edgeIds.has(id));

  if (staleNodeIds.length) {
    const { error } = await supabase.from('nodes').delete().eq('board_id', boardId).in('rf_id', staleNodeIds);
    if (error) throw error;
  }
  if (staleEdgeIds.length) {
    const { error } = await supabase.from('edges').delete().eq('board_id', boardId).in('rf_id', staleEdgeIds);
    if (error) throw error;
  }

  await upsertRows('nodes', nodeRows, 'board_id,rf_id');
  await upsertRows('edges', edgeRows, 'board_id,rf_id');
}

/** Row-level sync — never delete-all before insert (avoids realtime race). */
async function syncComments(boardId, threads, { allowClear = false } = {}) {
  const commentRows = threads
    .filter((c) => (c.replies || []).length > 0)
    .map((c) => toCommentRow(boardId, c));

  const { data: existing, error: listErr } = await supabase
    .from('comments')
    .select('id, client_id, thread')
    .eq('board_id', boardId);
  if (listErr) throw listErr;

  if (!commentRows.length) {
    // Never wipe DB comments unless this is an explicit comment save with zero threads
    if (allowClear && existing?.length) await deleteWhere('comments', boardId);
    return;
  }

  const existingByClient = new Map();
  for (const row of existing || []) {
    const cid = row.client_id || row.thread?.clientId;
    if (cid) existingByClient.set(cid, row.id);
  }

  const keepClientIds = new Set();

  for (const row of commentRows) {
    const clientId = row.client_id;
    if (!clientId) continue;
    keepClientIds.add(clientId);

    const existingId = existingByClient.get(clientId);
    if (existingId) {
      const { error } = await supabase.from('comments').update({
        x: row.x,
        y: row.y,
        thread: row.thread,
        resolved: row.resolved,
        updated_at: new Date().toISOString(),
      }).eq('id', existingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('comments').insert(row);
      if (error) throw error;
    }
  }

  const staleIds = (existing || [])
    .filter((row) => {
      const cid = row.client_id || row.thread?.clientId;
      return cid && !keepClientIds.has(cid);
    })
    .map((row) => row.id);

  if (staleIds.length) {
    const { error } = await supabase.from('comments').delete().in('id', staleIds);
    if (error) throw error;
  }
}

/** Row-level sync for sketch strokes — same safe pattern as comments. */
async function syncAnnotations(boardId, strokes, { allowClear = false } = {}) {
  const rows = (strokes || []).map((s) => toAnnotationRow(boardId, s));

  const { data: existing, error: listErr } = await supabase
    .from('annotations')
    .select('id, client_id, data')
    .eq('board_id', boardId);
  if (listErr) throw listErr;

  if (!rows.length) {
    if (allowClear && existing?.length) await deleteWhere('annotations', boardId);
    return;
  }

  const existingByClient = new Map();
  for (const row of existing || []) {
    const cid = row.client_id || row.data?.id;
    if (cid) existingByClient.set(cid, row.id);
  }

  const keepClientIds = new Set();

  for (const row of rows) {
    const clientId = row.client_id;
    if (!clientId) continue;
    keepClientIds.add(clientId);

    const existingId = existingByClient.get(clientId);
    if (existingId) {
      const { error } = await supabase.from('annotations').update({
        type: row.type,
        data: row.data,
      }).eq('id', existingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('annotations').insert(row);
      if (error) throw error;
    }
  }

  const staleIds = (existing || [])
    .filter((row) => {
      const cid = row.client_id || row.data?.id;
      return cid && !keepClientIds.has(cid);
    })
    .map((row) => row.id);

  if (staleIds.length) {
    const { error: delErr } = await supabase.from('annotations').delete().in('id', staleIds);
    if (delErr) throw delErr;
  }
}

async function withSaveLock(fn) {
  beginSaveLock();
  try {
    return await fn();
  } finally {
    endSaveLock();
    pauseCommentSync();
  }
}

export const PersistenceService = {
  validateCode(code) {
    return code === SAVE_CODE;
  },

  async load(journeyId, legacyId) {
    const tryLoad = async (id) => {
      if (!id) return null;
      if (!isSupabaseConfigured) return memory.get(id) || null;

      try {
        const { data: board, error: bErr } = await supabase
          .from('boards')
          .select('*')
          .eq('journey_id', id)
          .maybeSingle();
        if (bErr) throw bErr;
        if (!board) return null;

        const [nodesRes, edgesRes, commentsRes, annotationsRes] = await Promise.all([
          supabase.from('nodes').select('*').eq('board_id', board.id),
          supabase.from('edges').select('*').eq('board_id', board.id),
          supabase.from('comments').select('*').eq('board_id', board.id),
          supabase.from('annotations').select('*').eq('board_id', board.id),
        ]);

        if (nodesRes.error) console.error('[PersistenceService.load] nodes', nodesRes.error);
        if (edgesRes.error) console.error('[PersistenceService.load] edges', edgesRes.error);
        if (commentsRes.error) console.error('[PersistenceService.load] comments', commentsRes.error);
        if (annotationsRes.error) console.error('[PersistenceService.load] annotations', annotationsRes.error);

        return {
          boardId: board.id,
          nodes: (nodesRes.data || []).map(fromNodeRow),
          edges: (edgesRes.data || []).map(fromEdgeRow),
          comments: (commentsRes.data || []).map(fromCommentRow),
          annotations: (annotationsRes.data || []).map(fromAnnotationRow),
          viewport: board.viewport,
          edgeStyle: board.edge_style,
          mermaidSource: board.mermaid_source || null,
          savedBy: board.saved_by,
          updatedAt: board.updated_at,
        };
      } catch (err) {
        console.error('[PersistenceService.load]', id, err);
        return null;
      }
    };

    const primary = await tryLoad(journeyId);
    if (primary) return primary;
    if (legacyId && legacyId !== journeyId) return tryLoad(legacyId);
    return null;
  },

  /** Save only comments — isolated from diagram edge/node failures. */
  async saveComments(journeyId, comments, { savedBy, viewport, edgeStyle } = {}) {
    if (!isSupabaseConfigured) {
      const prev = memory.get(journeyId) || {};
      memory.set(journeyId, { ...prev, comments });
      return { boardId: prev.boardId, comments };
    }

    return runSerialized(journeyId, () => withSaveLock(async () => {
      const boardId = await getOrCreateBoardId(
        journeyId,
        savedBy || 'Guest',
        viewport || { x: 0, y: 0, zoom: 1 },
        edgeStyle || 'smoothstep',
      );
      await syncComments(boardId, comments || [], { allowClear: true });
      return { boardId, updatedAt: new Date().toISOString() };
    }));
  },

  /** Save only sketch strokes — isolated from diagram edge/node failures. */
  async saveAnnotations(journeyId, annotations, { savedBy, viewport, edgeStyle } = {}) {
    if (!isSupabaseConfigured) {
      const prev = memory.get(journeyId) || {};
      memory.set(journeyId, { ...prev, annotations });
      return { boardId: prev.boardId, annotations };
    }

    return runSerialized(journeyId, () => withSaveLock(async () => {
      const boardId = await getOrCreateBoardId(
        journeyId,
        savedBy || 'Guest',
        viewport || { x: 0, y: 0, zoom: 1 },
        edgeStyle || 'smoothstep',
      );
      await syncAnnotations(boardId, annotations || [], { allowClear: true });
      return { boardId, updatedAt: new Date().toISOString() };
    }));
  },

  async saveDiagram(journeyId, { nodes, edges, viewport, edgeStyle, mermaidSource }, savedBy) {
    if (!isSupabaseConfigured) {
      const prev = memory.get(journeyId) || {};
      memory.set(journeyId, { ...prev, nodes, edges, viewport, edgeStyle, mermaidSource: mermaidSource || null });
      return { boardId: prev.boardId };
    }

    return runSerialized(journeyId, () => withSaveLock(async () => {
      const boardId = await getOrCreateBoardId(
        journeyId,
        savedBy || 'Guest',
        viewport || { x: 0, y: 0, zoom: 1 },
        edgeStyle || 'smoothstep',
      );

      await syncDiagramRows(boardId, nodes, edges);
      const updatedAt = await finalizeBoard(boardId, {
        savedBy: savedBy || 'Guest',
        viewport: viewport || { x: 0, y: 0, zoom: 1 },
        edgeStyle: edgeStyle || 'smoothstep',
        mermaidSource: mermaidSource || null,
      });
      markBoardSaveComplete(updatedAt);
      return { boardId, updatedAt };
    }));
  },

  async save(journeyId, state, savedBy, code) {
    if (code && !this.validateCode(code)) throw new Error('Invalid confirmation code');

    return runSerialized(journeyId, () => withSaveLock(() => this._saveInternal(journeyId, state, savedBy)));
  },

  async _saveInternal(journeyId, state, savedBy, { explicit = true } = {}) {
    const payload = {
      nodes: state.nodes,
      edges: state.edges,
      comments: state.comments,
      annotations: state.annotations || state.strokes || [],
      viewport: state.viewport,
      edgeStyle: state.edgeStyle,
      mermaidSource: state.mermaidSource || null,
      savedBy,
      updatedAt: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      memory.set(journeyId, payload);
      markBoardSaveComplete(payload.updatedAt);
      return payload;
    }

    const boardId = await getOrCreateBoardId(
      journeyId,
      savedBy,
      state.viewport,
      state.edgeStyle,
    );

    // Diagram first — board row updates last (realtime listens to boards)
    await syncDiagramRows(boardId, state.nodes, state.edges);
    await syncComments(boardId, state.comments || [], { allowClear: explicit });
    await syncAnnotations(boardId, state.annotations || state.strokes || [], { allowClear: explicit });

    const updatedAt = await finalizeBoard(boardId, {
      savedBy,
      viewport: state.viewport,
      edgeStyle: state.edgeStyle,
      mermaidSource: state.mermaidSource || null,
    });

    markBoardSaveComplete(updatedAt);
    return { ...payload, boardId, updatedAt };
  },

  subscribe(journeyId, onBoardUpdate) {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel(`board-sync:${journeyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'boards', filter: `journey_id=eq.${journeyId}` },
        () => onBoardUpdate(),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};
