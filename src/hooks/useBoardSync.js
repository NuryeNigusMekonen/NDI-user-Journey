import { useEffect, useRef } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { PersistenceService } from '../services/PersistenceService';
import { prepareLoadedEdges } from '../services/FlowInference';
import { WORKSPACE_MODE } from '../types/diagram';
import { resolveMermaidBoard } from '../lib/bootstrapMermaidBoard';
import {
  shouldSkipCommentSync, shouldSkipBoardReload, mergeComments, getLastLocalSaveAt,
} from '../lib/commentSyncGuard';

const RELOAD_DEBOUNCE_MS = 800;

/**
 * Pull remote board changes from Supabase so viewers see saves in near real-time.
 * Skips reload while the local user is actively editing (to avoid clobbering in-progress work).
 */
export function useBoardSync({ journeyId, journey, workspaceMode, loading, onReload }) {
  const reloading = useRef(false);
  const timer = useRef(null);
  const lastSavedAt = useRef(null);

  useEffect(() => {
    if (!journeyId || loading) return undefined;

    const reload = async () => {
      if (reloading.current || shouldSkipBoardReload()) return;

      reloading.current = true;
      try {
        const saved = await PersistenceService.load(journeyId);
        if (!saved) return;

        const store = useDiagramStore.getState();
        if (saved.updatedAt && saved.updatedAt === lastSavedAt.current) return;
        if (saved.updatedAt && saved.updatedAt === getLastLocalSaveAt()) {
          lastSavedAt.current = saved.updatedAt;
          return;
        }
        lastSavedAt.current = saved.updatedAt;

        const mergedComments = mergeComments(store.comments, saved.comments || []);

        if (workspaceMode === WORKSPACE_MODE.EDIT) {
          if (shouldSkipCommentSync()) return;
          store.patch({
            comments: mergedComments,
            annotations: saved.annotations || [],
          }, false);
          return;
        }

        const edgeStyle = saved.edgeStyle || store.edgeStyle;
        const resolved = await resolveMermaidBoard(journey, saved, edgeStyle);

        store.loadBoard({
          nodes: resolved.nodes,
          edges: prepareLoadedEdges(
            resolved.edges.map((e) => ({ ...e, type: e.type || edgeStyle })),
            edgeStyle,
          ),
          comments: mergedComments,
          annotations: saved.annotations || [],
          edgeStyle,
          viewport: saved.viewport,
          mermaidSource: resolved.mermaidSource,
        });
        store.setBoardMeta({ boardId: saved.boardId, journeyId });
        onReload?.(saved);
      } catch (err) {
        console.error('[board-sync]', err);
      } finally {
        reloading.current = false;
      }
    };

    const scheduleReload = () => {
      if (shouldSkipBoardReload()) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(reload, RELOAD_DEBOUNCE_MS);
    };

    const unsub = PersistenceService.subscribe(journeyId, scheduleReload);
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [journeyId, journey, workspaceMode, loading, onReload]);
}
