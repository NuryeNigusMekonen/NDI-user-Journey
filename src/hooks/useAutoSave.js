import { useEffect, useRef, useState } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { PersistenceService } from '../services/PersistenceService';
import { markBoardSaveComplete } from '../lib/commentSyncGuard';

const DEBOUNCE_MS = 3000;

/**
 * Autosave diagram structure only (nodes/edges/viewport).
 * Comments and sketches use dedicated save paths — never autosave overlays.
 */
export function useAutoSave({ journeyId, enabled, authorName, getViewport }) {
  const [status, setStatus] = useState('idle');
  const timer = useRef(null);
  const saving = useRef(false);
  const pending = useRef(false);

  useEffect(() => {
    if (!enabled || !journeyId) return undefined;

    let prevNodes = useDiagramStore.getState().nodes;
    let prevEdges = useDiagramStore.getState().edges;

    const flush = async () => {
      if (saving.current) return;
      const store = useDiagramStore.getState();
      if (store.loading) return;

      saving.current = true;
      setStatus('saving');
      try {
        const vp = getViewport?.() || store.viewport;
        if (vp) store.setViewport(vp);
        const result = await PersistenceService.saveDiagram(journeyId, {
          nodes: store.nodes,
          edges: store.edges,
          viewport: vp || store.viewport,
          edgeStyle: store.edgeStyle,
          mermaidSource: store.mermaidSource,
        }, authorName);
        if (result?.boardId) {
          store.setBoardMeta({ boardId: result.boardId, journeyId });
        }
        if (result?.updatedAt) markBoardSaveComplete(result.updatedAt);
        setStatus('saved');
        pending.current = false;
      } catch (err) {
        console.error('[autosave]', err?.message || err, err?.details || '');
        setStatus('error');
      } finally {
        saving.current = false;
      }
    };

    const schedule = () => {
      pending.current = true;
      if (timer.current) clearTimeout(timer.current);
      setStatus('pending');
      timer.current = setTimeout(flush, DEBOUNCE_MS);
    };

    const unsub = useDiagramStore.subscribe((state) => {
      if (state.loading) return;
      if (state.nodes === prevNodes && state.edges === prevEdges) return;
      prevNodes = state.nodes;
      prevEdges = state.edges;
      schedule();
    });

    const onUnload = () => {
      if (!pending.current) return;
      const store = useDiagramStore.getState();
      if (store.loading) return;
      const vp = getViewport?.() || store.viewport;
      PersistenceService.saveDiagram(journeyId, {
        nodes: store.nodes,
        edges: store.edges,
        viewport: vp || store.viewport,
        edgeStyle: store.edgeStyle,
        mermaidSource: store.mermaidSource,
      }, authorName).catch(() => {});
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      unsub();
      window.removeEventListener('beforeunload', onUnload);
      if (timer.current) clearTimeout(timer.current);
      pending.current = false;
    };
  }, [journeyId, enabled, authorName, getViewport]);

  return status;
}
