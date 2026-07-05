import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 50;

export function useUndoRedo(initialState) {
  const [state, setState] = useState(initialState);
  const [historyLen, setHistoryLen] = useState({ past: 0, future: 0 });
  const past = useRef([]);
  const future = useRef([]);

  const syncLen = () => setHistoryLen({ past: past.current.length, future: future.current.length });

  const push = useCallback((next) => {
    setState((current) => {
      past.current = [...past.current.slice(-MAX_HISTORY + 1), current];
      future.current = [];
      setHistoryLen({ past: past.current.length, future: 0 });
      return next;
    });
  }, []);

  const replace = useCallback((next) => {
    setState(next);
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [state, ...future.current];
    setState(prev);
    syncLen();
  }, [state]);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current, state];
    setState(next);
    syncLen();
  }, [state]);

  const reset = useCallback((next) => {
    past.current = [];
    future.current = [];
    setState(next);
    syncLen();
  }, []);

  return {
    state,
    push,
    replace,
    undo,
    redo,
    reset,
    canUndo: historyLen.past > 0,
    canRedo: historyLen.future > 0,
  };
}
