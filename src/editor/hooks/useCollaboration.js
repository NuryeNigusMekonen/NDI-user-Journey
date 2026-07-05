import { useCallback, useEffect, useRef } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { BoardService } from '../services/BoardService';
import { CommentService } from '../services/CommentService';

export function useCollaboration({
  journeyId,
  isEditMode,
  replace,
  setToast,
}) {
  const stateRef = useRef(null);
  const syncingRef = useRef(false);

  const setStateRef = useCallback((state) => {
    stateRef.current = state;
  }, []);

  const refreshComments = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const comments = await CommentService.fetchByJourney(journeyId);
      const current = stateRef.current;
      if (current) replace({ ...current, comments });
    } catch {
      setToast('Failed to sync comments');
    } finally {
      syncingRef.current = false;
    }
  }, [journeyId, replace, setToast]);

  useEffect(() => {
    let cancelled = false;

    const unsubComments = CommentService.subscribe(journeyId, () => {
      if (!cancelled) refreshComments();
    });

    const unsubBoard = BoardService.subscribe(journeyId, async (row) => {
      if (cancelled) return;
      if (isEditMode) {
        setToast(`Board saved by ${row.saved_by || 'someone'}`);
        return;
      }
      try {
        const current = stateRef.current;
        if (!current) return;
        replace({
          ...current,
          nodes: row.nodes,
          edges: row.edges,
          strokes: row.strokes || [],
        });
        setToast(`Board updated by ${row.saved_by || 'someone'}`);
        setTimeout(() => setToast(''), 3000);
      } catch {
        setToast('Failed to sync board');
      }
    });

    return () => {
      cancelled = true;
      unsubComments();
      unsubBoard();
    };
  }, [journeyId, isEditMode, replace, refreshComments, setToast]);

  return { setStateRef, refreshComments, isLive: isSupabaseConfigured };
}
