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
  open = false,
  onClose,
}) {
  const isEmbed = view !== VIEW.JOURNEY;
  const j = isEmbed ? journeys[0] : journeys[active];
  const fillPct = isEmbed ? 0 : (j.stage / (stages.length - 1)) * 100;

  // On mobile the rail is an off-canvas drawer; from lg up it is a static column.
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-[2px]"
          aria-hidden="true"
        />
      )}
      <aside
        className={`w-[280px] shrink-0 bg-rail flex flex-col
          fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:z-auto lg:translate-x-0`}
      >
      <div className="px-5 pt-6 pb-5 border-b border-rail-line">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/25 flex items-center justify-center">
            <Activity className="w-[18px] h-[18px] text-white" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="font-display text-[16px] font-bold text-white tracking-tight leading-none">
              NINE DEAN
            </h1>
            <p className="text-[10px] font-mono text-white/55 mt-1.5 leading-none tracking-wide">
              quality-of-jobs · v1
            </p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-rail-line space-y-1">
        {VIEW_ITEMS.map((v) => {
          const Icon = v.icon;
          const isActive = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => { onViewChange?.(v.id); onClose?.(); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                isActive ? 'bg-white text-rail shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand' : 'text-white/70'}`} strokeWidth={2.25} />
              <span className="text-[13px] font-semibold">{v.label}</span>
            </button>
          );
        })}
      </div>

      <div className="px-5 py-4 border-b border-rail-line">
        <p className="text-[9px] font-mono font-semibold tracking-[0.2em] uppercase text-white/50 mb-3">Pipeline</p>
        <div className="relative px-1">
          <div className="absolute top-2 left-3 right-3 h-px bg-white/20" />
          <motion.div
            className="absolute top-2 left-3 h-px bg-brand-active"
            animate={{ width: `calc(${fillPct}% - 12px)` }}
            transition={{ duration: 0.4 }}
          />
          <div className="flex justify-between relative">
            {stages.map((s, i) => (
              <button
                key={s}
                onClick={() => { onStageSelect(i); onClose?.(); }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    i === j.stage
                      ? 'bg-white border-white scale-110'
                      : i < j.stage
                        ? 'bg-brand-active border-brand-active'
                        : 'border-white/30 bg-rail group-hover:border-white/60'
                  }`}
                />
                <span
                  className={`text-[8px] font-medium text-center max-w-[52px] leading-tight ${
                    i <= j.stage ? 'text-white/85' : 'text-white/40'
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
        <p className="text-[9px] font-mono font-semibold tracking-[0.2em] uppercase text-white/50">Journeys</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {journeys.map((x, i) => {
          const isActive = !isEmbed && i === active;
          return (
            <button
              key={i}
              onClick={() => { onSelect(i); onClose?.(); }}
              className={`group relative w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive ? 'bg-white/12' : 'hover:bg-white/[0.07]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-0.5 bg-brand-active rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-mono font-bold shrink-0 transition-colors border ${
                  isActive
                    ? 'bg-white text-rail border-white'
                    : 'bg-white/10 text-white/70 border-white/20 group-hover:text-white group-hover:border-white/40'
                } ${x.parallel ? 'border-dashed' : ''}`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={`text-[13px] font-semibold leading-snug transition-colors ${
                    isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                  }`}
                >
                  {x.title}
                </p>
                <p className={`text-[10px] font-mono mt-1 leading-tight ${isActive ? 'text-brand-active' : 'text-white/50'}`}>
                  {x.parallel ? '↻ background' : stages[x.stage]}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-3.5 border-t border-rail-line">
        <p className="text-[10px] font-mono text-white/45 leading-relaxed">
          <kbd className="text-white/60">←</kbd>{' '}
          <kbd className="text-white/60">→</kbd> navigate journeys
        </p>
      </div>
      </aside>
    </>
  );
}
