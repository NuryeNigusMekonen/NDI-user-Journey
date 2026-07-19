import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar, { VIEW } from './components/Sidebar';
import AppHeader from './components/AppHeader';
import TestsView from './components/TestsView';
import DataView from './components/DataView';
import AuthGate from './components/AuthGate';
import JourneyOverview from './components/JourneyOverview';
import { journeys } from './data/journeys';
import { WORKSPACE_MODE } from './types/diagram';
import { useDiagramStore } from './store/diagramStore';
import { useWorkspaceStore } from './store/workspaceStore';
import { useWorkspacePresence } from './hooks/useWorkspacePresence';
import { getJourneyId } from './lib/journeyRegistry';
import { resolveJourneyIndex } from './lib/journeyMatch';

const EditorCanvas = lazy(() => import('./editor/EditorCanvas'));

export default function App() {
  // Land on the end-to-end overview, not journey 1's diagram — the map is the orientation.
  const [view, setView] = useState(VIEW.OVERVIEW);
  const [active, setActive] = useState(0);
  const [workspaceMode, setWorkspaceMode] = useState(WORKSPACE_MODE.VIEW);
  const [navOpen, setNavOpen] = useState(false);

  const isEmbed = view !== VIEW.JOURNEY;
  const j = journeys[active];
  const journeyId = getJourneyId(j, active);
  const journeyTitle = j?.title;

  const handleWorkspaceModeChange = useCallback((mode) => {
    if (mode === WORKSPACE_MODE.EDIT && workspaceMode !== WORKSPACE_MODE.EDIT) {
      useDiagramStore.getState().beginEditSession();
    }
    setWorkspaceMode(mode);
  }, [workspaceMode]);

  const { toggleFollow, onNameChange } = useWorkspacePresence({ journeyId, journeyTitle });

  useEffect(() => {
    useWorkspaceStore.getState().setPresenceApi({ toggleFollow, onNameChange, journeyId });
    return () => useWorkspaceStore.getState().setPresenceApi(null);
  }, [toggleFollow, onNameChange, journeyId]);

  const go = useCallback((i) => {
    if (i < 0 || i >= journeys.length) return;
    setView(VIEW.JOURNEY);
    setActive(i);
  }, []);

  const onStageSelect = useCallback((stage) => {
    setView(VIEW.JOURNEY);
    const idx = journeys.findIndex((x) => x.stage === stage && !x.parallel);
    if (idx >= 0) go(idx);
    else {
      const fallback = journeys.findIndex((x) => x.stage >= stage);
      go(fallback >= 0 ? fallback : 0);
    }
  }, [go]);

  useEffect(() => {
    useWorkspaceStore.getState().setNavigation({
      goToJourneyId: (id) => {
        setView(VIEW.JOURNEY);
        const idx = resolveJourneyIndex(id);
        if (idx >= 0) go(idx);
      },
    });
    return () => useWorkspaceStore.getState().setNavigation(null);
  }, [go]);

  useEffect(() => {
    const onKey = (e) => {
      if (isEmbed || workspaceMode === WORKSPACE_MODE.EDIT) return;
      if (e.key === 'ArrowRight') go(active >= journeys.length - 1 ? 0 : active + 1);
      if (e.key === 'ArrowLeft') go(Math.max(active - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go, workspaceMode, isEmbed]);

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <Sidebar
        journeys={journeys}
        active={active}
        view={view}
        onSelect={go}
        onStageSelect={onStageSelect}
        onViewChange={setView}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar — the rail is off-canvas below lg */}
        <div className="lg:hidden shrink-0 flex items-center gap-3 px-4 h-14 bg-rail">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img
            src={`${import.meta.env.BASE_URL || '/'}nd-logo-white.png`}
            alt="Nine Dean"
            className="h-5 w-auto"
          />
        </div>

        {view === VIEW.OVERVIEW ? (
          <JourneyOverview onSelect={(i) => { setView(VIEW.JOURNEY); setActive(i); }} />
        ) : view === VIEW.TESTS ? (
          <AuthGate title="Test Plan"><TestsView /></AuthGate>
        ) : view === VIEW.DATA ? (
          <AuthGate title="Simulated Data"><DataView /></AuthGate>
        ) : (
        <>
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
        </>
        )}
      </div>
    </div>
  );
}
