import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WorkspaceToolbar from '../canvas/WorkspaceToolbar';
import WorkspacePeoplePanel from '../canvas/WorkspacePeoplePanel';

export default function AppHeader({
  journey,
  journeyIndex,
  totalJourneys,
  onPrev,
  onNext,
  canGoPrev,
  isLast,
  workspaceMode,
  onWorkspaceModeChange,
}) {
  return (
    <header className="shrink-0 bg-surface border-b border-hairline">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <motion.div
            key={journeyIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 flex-1"
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-[11px] font-mono font-semibold text-ink-muted tabular-nums">
                {String(journeyIndex + 1).padStart(2, '0')}<span className="text-hairline mx-1">/</span>{String(totalJourneys).padStart(2, '0')}
              </span>
              {journey.parallel && (
                <span className="text-[10px] font-mono font-medium text-brand bg-brand/10 border border-brand/30 px-2 py-0.5 rounded">
                  ↻ background
                </span>
              )}
            </div>
            <h1 className="font-display text-[1.2rem] font-bold text-ink tracking-tight leading-snug">
              {journey.title}
            </h1>
            <p className="text-[12px] text-ink-muted mt-0.5 leading-relaxed max-w-xl line-clamp-2">{journey.tagline}</p>
          </motion.div>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <WorkspacePeoplePanel />
            <button
              onClick={onPrev}
              disabled={!canGoPrev}
              aria-label="Previous journey"
              className="h-8 w-8 rounded-lg border border-hairline flex items-center justify-center text-ink hover:bg-surface-hover disabled:opacity-25 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              className="h-8 px-3 rounded-lg bg-brand text-canvas text-xs font-semibold hover:bg-brand-dark transition-colors inline-flex items-center gap-1 shadow-glow"
            >
              {isLast ? 'Restart' : 'Next'}<ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-2.5 border-t border-hairline bg-canvas/40 overflow-x-auto">
        <WorkspaceToolbar
          workspaceMode={workspaceMode}
          onWorkspaceModeChange={onWorkspaceModeChange}
        />
      </div>
    </header>
  );
}
