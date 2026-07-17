import { motion } from 'framer-motion';
import { Activity, GitBranch, FlaskConical, Database } from 'lucide-react';
import { stages } from '../data/journeys';

export const VIEW = {
  JOURNEY: 'journey',
  TESTS: 'tests',
  DATA: 'data',
};

const VIEW_ITEMS = [
  { id: VIEW.JOURNEY, label: 'Journey Map', icon: GitBranch },
  { id: VIEW.TESTS, label: 'Test Plan', icon: FlaskConical },
  { id: VIEW.DATA, label: 'Simulated Data', icon: Database },
];

export default function Sidebar({
  journeys,
  active,
  view,
  onSelect,
  onStageSelect,
  onViewChange,
}) {
  const isEmbed = view !== VIEW.JOURNEY;
  const j = isEmbed ? journeys[0] : journeys[active];
  const fillPct = isEmbed ? 0 : (j.stage / (stages.length - 1)) * 100;

  return (
    <aside className="w-[280px] shrink-0 bg-surface flex flex-col border-r border-hairline">
      <div className="px-5 pt-6 pb-5 border-b border-hairline">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand/15 border border-brand/40 flex items-center justify-center shadow-glow">
            <Activity className="w-[18px] h-[18px] text-brand" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="font-display text-[16px] font-bold text-ink tracking-tight leading-none">
              NINE DEAN
            </h1>
            <p className="text-[10px] font-mono text-ink-muted mt-1.5 leading-none tracking-wide">
              quality-of-jobs · v1
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-hairline space-y-1">
        {VIEW_ITEMS.map((v) => {
          const Icon = v.icon;
          const isActive = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onViewChange?.(v.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors border ${
                isActive ? 'bg-brand/10 border-brand/30' : 'border-transparent hover:bg-surface-hover'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand' : 'text-ink-muted'}`} strokeWidth={2.25} />
              <span className={`text-[13px] font-semibold ${isActive ? 'text-ink' : 'text-ink/80'}`}>{v.label}</span>
            </button>
          );
        })}
      </div>

      <div className="px-5 py-4 border-b border-hairline">
        <p className="text-[9px] font-mono font-semibold tracking-[0.2em] uppercase text-brand/70 mb-3">Pipeline</p>
        <div className="relative px-1">
          <div className="absolute top-2 left-3 right-3 h-px bg-hairline" />
          <motion.div
            className="absolute top-2 left-3 h-px bg-brand"
            style={{ boxShadow: '0 0 8px rgba(56,189,248,.6)' }}
            animate={{ width: `calc(${fillPct}% - 12px)` }}
            transition={{ duration: 0.4 }}
          />
          <div className="flex justify-between relative">
            {stages.map((s, i) => (
              <button
                key={s}
                onClick={() => onStageSelect(i)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    i === j.stage
                      ? 'bg-brand border-brand scale-110 shadow-glow'
                      : i < j.stage
                        ? 'bg-brand/40 border-brand/60'
                        : 'border-hairline bg-surface group-hover:border-ink-muted'
                  }`}
                />
                <span
                  className={`text-[8px] font-medium text-center max-w-[52px] leading-tight ${
                    i <= j.stage ? 'text-ink/80' : 'text-ink-muted/60'
                  }`}
                >
                  {s}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <p className="text-[9px] font-mono font-semibold tracking-[0.2em] uppercase text-brand/70">Journeys</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {journeys.map((x, i) => {
          const isActive = !isEmbed && i === active;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`group relative w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border ${
                isActive
                  ? 'bg-brand/10 border-brand/30'
                  : 'border-transparent hover:bg-surface-hover'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-0.5 bg-brand rounded-full"
                  style={{ boxShadow: '0 0 8px rgba(56,189,248,.7)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-mono font-bold shrink-0 transition-colors border ${
                  isActive
                    ? 'bg-brand text-canvas border-brand'
                    : 'bg-surface-raised text-ink-muted border-hairline group-hover:text-ink group-hover:border-ink-muted'
                } ${x.parallel ? 'border-dashed' : ''}`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={`text-[13px] font-semibold leading-snug transition-colors ${
                    isActive ? 'text-ink' : 'text-ink/80 group-hover:text-ink'
                  }`}
                >
                  {x.title}
                </p>
                <p className={`text-[10px] font-mono mt-1 leading-tight ${isActive ? 'text-brand/70' : 'text-ink-muted/70'}`}>
                  {x.parallel ? '↻ background' : stages[x.stage]}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-3.5 border-t border-hairline">
        <p className="text-[10px] font-mono text-ink-muted/60 leading-relaxed">
          <kbd className="text-brand/60">←</kbd>{' '}
          <kbd className="text-brand/60">→</kbd> navigate journeys
        </p>
      </div>
    </aside>
  );
}
