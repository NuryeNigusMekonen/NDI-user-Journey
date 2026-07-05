import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
import { journeys } from './data/journeys';
import { WORKSPACE_MODE } from './types/diagram';
import { useDiagramStore } from './store/diagramStore';

const EditorCanvas = lazy(() => import('./editor/EditorCanvas'));

export default function App() {
  const [active, setActive] = useState(0);
  const [workspaceMode, setWorkspaceMode] = useState(WORKSPACE_MODE.VIEW);

  const handleWorkspaceModeChange = useCallback((mode) => {
    if (mode === WORKSPACE_MODE.EDIT && workspaceMode !== WORKSPACE_MODE.EDIT) {
      useDiagramStore.getState().beginEditSession();
    }
    setWorkspaceMode(mode);
  }, [workspaceMode]);
  const j = journeys[active];

  const go = useCallback((i) => {
    if (i < 0 || i >= journeys.length) return;
    setActive(i);
  }, []);

  const onStageSelect = useCallback((stage) => {
    const idx = journeys.findIndex((x) => x.stage === stage && !x.parallel);
    if (idx >= 0) go(idx);
    else {
      const fallback = journeys.findIndex((x) => x.stage >= stage);
      go(fallback >= 0 ? fallback : 0);
    }
  }, [go]);

  useEffect(() => {
    const onKey = (e) => {
      if (workspaceMode === WORKSPACE_MODE.EDIT) return;
      if (e.key === 'ArrowRight') go(active >= journeys.length - 1 ? 0 : active + 1);
      if (e.key === 'ArrowLeft') go(Math.max(active - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go, workspaceMode]);

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <Sidebar journeys={journeys} active={active} onSelect={go} onStageSelect={onStageSelect} />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          journey={j}
          journeyIndex={active}
          totalJourneys={journeys.length}
          onPrev={() => go(active - 1)}
          onNext={() => go(active >= journeys.length - 1 ? 0 : active + 1)}
          canGoPrev={active > 0}
          isLast={active >= journeys.length - 1}
          workspaceMode={workspaceMode}
          onWorkspaceModeChange={handleWorkspaceModeChange}
        />

        <div className="flex-1 min-h-0 relative">
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center bg-[#FAFAF8] text-sm text-ink-muted">
                Loading workspace…
              </div>
            }
          >
            <EditorCanvas
              journey={j}
              journeyIndex={active}
              workspaceMode={workspaceMode}
              onWorkspaceModeChange={handleWorkspaceModeChange}
            />
          </Suspense>
        </div>

        <footer className="shrink-0 flex items-center justify-center gap-3 px-6 py-2.5 bg-white border-t border-line">
          {journeys.map((item, i) => (
            <button key={item.id || i} onClick={() => go(i)} title={item.title} className="group flex flex-col items-center gap-1">
              <span className={`block rounded-full transition-all duration-300 ${
                i === active ? 'w-6 h-1.5 bg-brand' : 'w-1.5 h-1.5 bg-line group-hover:bg-brand-muted'
              }`} />
            </button>
          ))}
        </footer>
      </div>
    </div>
  );
}
