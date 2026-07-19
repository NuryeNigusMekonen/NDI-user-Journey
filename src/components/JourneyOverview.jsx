import { motion } from 'framer-motion';
import { ArrowDown, GitBranch, Repeat } from 'lucide-react';
import { journeys, stages } from '../data/journeys';

// The end-to-end picture: all six journeys as connected stages, so the shape of the platform is
// visible at a glance — Upload feeds Fair Pay (A), A hands off to PSL (B) and Healthcare (C) IN
// PARALLEL, both land in Output, and the reference layer runs alongside the whole thing.
// Clicking a card drills into that journey's diagram.
export default function JourneyOverview({ onSelect }) {
  const byStage = stages.map((_, s) => journeys.filter((j) => j.stage === s));
  const crossCutting = journeys.filter((j) => j.parallel && j.stage === stages.length - 1);

  return (
    <div className="h-full overflow-y-auto bg-canvas px-4 sm:px-8 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-brand/15 border border-brand/40 flex items-center justify-center">
            <GitBranch className="w-[18px] h-[18px] text-brand" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="font-display text-[19px] font-bold text-ink tracking-tight leading-none">
              Journey Map
            </h2>
            <p className="text-[10px] font-mono text-ink-muted mt-1.5">
              census in → remediation cost + healthcare verdict out · click any stage to open it
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-1">
          {byStage.map((group, s) => {
            const main = group.filter((j) => !(j.parallel && j.stage === stages.length - 1));
            if (!main.length) return null;
            const isParallel = main.length > 1;
            return (
              <div key={s}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-mono font-bold text-brand/70 tracking-[0.18em] uppercase">
                    Stage {s}
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">{stages[s]}</span>
                  {isParallel && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet/15 text-violet border border-violet/30">
                      runs in parallel
                    </span>
                  )}
                </div>

                <div className={`grid gap-2 ${isParallel ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                  {main.map((j) => (
                    <motion.button
                      key={j.id}
                      onClick={() => onSelect?.(journeys.indexOf(j))}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: s * 0.05 }}
                      className="text-left p-4 rounded-xl bg-surface border border-hairline hover:border-brand/50 hover:bg-surface-hover transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-surface-raised border border-hairline text-[11px] font-mono font-bold text-ink-muted flex items-center justify-center group-hover:text-brand group-hover:border-brand/40">
                          {String(journeys.indexOf(j) + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[14px] font-semibold text-ink leading-snug">{j.title}</span>
                      </div>
                      <p className="text-[11px] text-ink-muted mt-2 leading-relaxed">{j.tagline}</p>
                      <p className="text-[10px] font-mono text-brand/60 mt-2">
                        {j.items.filter((i) => i.type === 'step').length} steps →
                      </p>
                    </motion.button>
                  ))}
                </div>

                {s < byStage.length - 1 && (
                  <div className="flex flex-col items-center py-2 text-ink-muted/60">
                    <ArrowDown className="w-4 h-4" strokeWidth={2} />
                    {s === 1 && (
                      <span className="text-[9px] font-mono text-violet/80 mt-0.5">
                        A hands wage-adjusted comp to BOTH B and C
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* cross-cutting: runs alongside every stage, not after them */}
        {crossCutting.length > 0 && (
          <div className="mt-8 pt-6 border-t border-hairline">
            <div className="flex items-center gap-2 mb-2">
              <Repeat className="w-3.5 h-3.5 text-teal" strokeWidth={2.25} />
              <span className="text-[9px] font-mono font-bold text-teal/80 tracking-[0.18em] uppercase">
                Cross-cutting — runs alongside every stage
              </span>
            </div>
            <div className="grid gap-2 grid-cols-1">
              {crossCutting.map((j) => (
                <button
                  key={j.id}
                  onClick={() => onSelect?.(journeys.indexOf(j))}
                  className="text-left p-4 rounded-xl bg-surface border border-dashed border-teal/30 hover:border-teal/60 hover:bg-surface-hover transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-surface-raised border border-dashed border-teal/40 text-[11px] font-mono font-bold text-teal flex items-center justify-center">
                      {String(journeys.indexOf(j) + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[14px] font-semibold text-ink leading-snug">{j.title}</span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-2 leading-relaxed">{j.tagline}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
