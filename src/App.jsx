import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
import GuideView from './components/GuideView';
import SectionsView from './components/SectionsView';
import { journeys } from './data/journeys';

const FlowCanvas = lazy(() => import('./components/FlowCanvas'));

export default function App() {
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState('map');
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
      if (e.key === 'ArrowRight') go(active >= journeys.length - 1 ? 0 : active + 1);
      if (e.key === 'ArrowLeft') go(Math.max(active - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go]);

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <Sidebar journeys={journeys} active={active} onSelect={go} onStageSelect={onStageSelect} />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          journey={j}
          journeyIndex={active}
          totalJourneys={journeys.length}
          mode={mode}
          onModeChange={setMode}
          onPrev={() => go(active - 1)}
          onNext={() => go(active >= journeys.length - 1 ? 0 : active + 1)}
          canGoPrev={active > 0}
          isLast={active >= journeys.length - 1}
        />

        <div className="flex-1 min-h-0 relative">
          {mode === 'map' && (
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center bg-[#FAFAF8] text-sm text-ink-muted">
                  Loading journey map…
                </div>
              }
            >
              <FlowCanvas journey={j} journeyIndex={active} />
            </Suspense>
          )}
          {mode === 'guide' && <GuideView journey={j} journeyIndex={active} key={`guide-${active}`} />}
          {mode === 'sections' && <SectionsView journey={j} journeyIndex={active} key={`sections-${active}`} />}
        </div>

        <footer className="shrink-0 flex items-center justify-center gap-3 px-6 py-2.5 bg-white border-t border-line">
          {journeys.map((item, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              title={item.title}
              className="group flex flex-col items-center gap-1"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 h-1.5 bg-navy' : 'w-1.5 h-1.5 bg-line group-hover:bg-brand-muted'
                }`}
              />
            </button>
          ))}
        </footer>
      </div>
    </div>
  );
}
