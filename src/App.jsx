import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Sidebar, { VIEW } from './components/Sidebar';
import AppHeader from './components/AppHeader';
import HtmlEmbedView from './views/HtmlEmbedView';
import { journeys } from './data/journeys';
import { WORKSPACE_MODE } from './types/diagram';
import { useDiagramStore } from './store/diagramStore';
import { useWorkspaceStore } from './store/workspaceStore';
import { useWorkspacePresence } from './hooks/useWorkspacePresence';
import { getJourneyId } from './lib/journeyRegistry';
import { resolveJourneyIndex } from './lib/journeyMatch';

const EditorCanvas = lazy(() => import('./editor/EditorCanvas'));

const EMBED_META = {
  [VIEW.MARIANATEK_FINDINGS]: {
    file: 'marianatek-data-findings.html',
    title: 'Mariana Tek Data Analysis',
    journeyId: 'marianatek-data-findings',
    journeyTitle: 'Mariana Tek Data',
  },
  [VIEW.STUDIO_DEMO]: {
    file: 'studio-journey-demo.html',
    title: 'Studio Journey Demo',
    journeyId: 'studio-journey-demo',
    journeyTitle: 'Studio Journey Demo',
  },
};

export default function App() {
  const [view, setView] = useState(VIEW.JOURNEY);
  const [active, setActive] = useState(0);
  const [workspaceMode, setWorkspaceMode] = useState(WORKSPACE_MODE.VIEW);

  const isEmbed = view !== VIEW.JOURNEY;
  const embed = EMBED_META[view];
  const j = journeys[active];
  const journeyId = embed?.journeyId ?? getJourneyId(j, active);
  const journeyTitle = embed?.journeyTitle ?? j?.title;

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

  const exitEditIfNeeded = useCallback(() => {
    if (workspaceMode === WORKSPACE_MODE.EDIT) {
      setWorkspaceMode(WORKSPACE_MODE.VIEW);
    }
  }, [workspaceMode]);

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

  const selectMarianaTekFindings = useCallback(() => {
    setView(VIEW.MARIANATEK_FINDINGS);
    exitEditIfNeeded();
  }, [exitEditIfNeeded]);

  const selectStudioDemo = useCallback(() => {
    setView(VIEW.STUDIO_DEMO);
    exitEditIfNeeded();
  }, [exitEditIfNeeded]);

  useEffect(() => {
    useWorkspaceStore.getState().setNavigation({
      goToJourneyId: (id) => {
        if (id === 'marianatek-data-findings') {
          setView(VIEW.MARIANATEK_FINDINGS);
          return;
        }
        if (id === 'studio-journey-demo') {
          setView(VIEW.STUDIO_DEMO);
          return;
        }
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
        onSelectMarianaTekFindings={selectMarianaTekFindings}
        onSelectStudioDemo={selectStudioDemo}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {isEmbed && embed ? (
          <div className="flex-1 min-h-0 bg-[#FAFAF8]">
            <HtmlEmbedView file={embed.file} title={embed.title} />
          </div>
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
