import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Map, Layers, Presentation } from 'lucide-react';

const MODES = [
  { id: 'map', label: 'Journey Map', icon: Map },
  { id: 'guide', label: 'Walkthrough', icon: Presentation },
  { id: 'sections', label: 'By Phase', icon: Layers },
];

export default function AppHeader({
  journey,
  journeyIndex,
  totalJourneys,
  mode,
  onModeChange,
  onPrev,
  onNext,
  canGoPrev,
  isLast,
}) {
  return (
    <header className="shrink-0 bg-white border-b border-line">
      <div className="px-6 pt-4 pb-0">
        <div className="flex items-start justify-between gap-6">
          <motion.div
            key={journeyIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 flex-1"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] font-semibold text-ink-muted tabular-nums">
                {journeyIndex + 1}
                <span className="text-line mx-1">/</span>
                {totalJourneys}
              </span>
              {journey.parallel && (
                <span className="text-[10px] font-medium text-brand bg-brand-light px-2 py-0.5 rounded-md">
                  Background journey
                </span>
              )}
            </div>
            <h1 className="font-display text-[1.35rem] font-semibold text-navy tracking-tight leading-snug">
              {journey.title}
            </h1>
            <p className="text-[13px] text-ink-muted mt-1 leading-relaxed max-w-xl">
              {journey.tagline}
            </p>
          </motion.div>

          <div className="flex items-center gap-2 shrink-0 pt-1">
            <button
              onClick={onPrev}
              disabled={!canGoPrev}
              aria-label="Previous journey"
              className="h-9 w-9 rounded-lg border border-line flex items-center justify-center text-ink hover:border-navy/30 hover:bg-cream disabled:opacity-25 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              aria-label={isLast ? 'Restart journeys' : 'Next journey'}
              className="h-9 px-3.5 rounded-lg bg-navy text-white text-[13px] font-semibold hover:bg-navy-dark transition-colors inline-flex items-center gap-1.5"
            >
              {isLast ? 'Restart' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 mt-4 flex items-end justify-between gap-4 border-t border-line/80">
        <nav className="flex gap-0 -mb-px" aria-label="View mode">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className={`relative inline-flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition-colors ${
                  isActive ? 'text-navy' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : ''}`} />
                {m.label}
                {isActive && (
                  <motion.span
                    layoutId="header-tab"
                    className="absolute bottom-0 left-3 right-3 h-0.5 bg-navy rounded-full"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
