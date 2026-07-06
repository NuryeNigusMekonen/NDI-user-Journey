import { motion } from 'framer-motion';
import { Compass, Database, Smartphone } from 'lucide-react';
import { stages } from '../data/journeys';

export const VIEW = {
  JOURNEY: 'journey',
  MARIANATEK_FINDINGS: 'marianatek-findings',
  STUDIO_DEMO: 'studio-demo',
};

function DemoNavButton({
  active, onClick, icon: Icon, title, subtitle,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
        active ? 'bg-white/10' : 'hover:bg-white/[0.06]'
      }`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute left-0 top-2 bottom-2 w-0.5 bg-brand rounded-full"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span
        className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors border ${
          active
            ? 'bg-white text-brand border-white'
            : 'bg-white/10 text-white border-white/20 group-hover:bg-white/15 group-hover:border-white/30'
        }`}
      >
        <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={`text-[13px] font-semibold leading-snug transition-colors ${
          active ? 'text-white' : 'text-white/90 group-hover:text-white'
        }`}
        >
          {title}
        </p>
        <p className={`text-[11px] mt-1 leading-tight ${active ? 'text-white/60' : 'text-white/55 group-hover:text-white/70'}`}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}

export default function Sidebar({
  journeys,
  active,
  view,
  onSelect,
  onStageSelect,
  onSelectMarianaTekFindings,
  onSelectStudioDemo,
}) {
  const isEmbed = view !== VIEW.JOURNEY;
  const j = isEmbed ? journeys[0] : journeys[active];
  const fillPct = isEmbed ? 0 : (j.stage / (stages.length - 1)) * 100;

  return (
    <aside className="w-[280px] shrink-0 bg-ink flex flex-col border-r border-black/10">
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-brand flex items-center justify-center shadow-sm">
            <Compass className="w-[18px] h-[18px] text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-display text-[17px] font-semibold text-white tracking-tight leading-none">
              Compass
            </h1>
            <p className="text-[11px] text-white/45 mt-1 leading-none">Member journey</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-y border-white/8">
        <p className="text-[9px] font-bold tracking-widest uppercase text-white/35 mb-3">Lifecycle</p>
        <div className="relative px-1">
          <div className="absolute top-2 left-3 right-3 h-0.5 bg-white/10 rounded" />
          <motion.div
            className="absolute top-2 left-3 h-0.5 bg-brand rounded"
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
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    i === j.stage
                      ? 'bg-white border-white scale-110'
                      : i < j.stage
                        ? 'bg-brand border-brand'
                        : 'border-white/25 bg-ink group-hover:border-white/50'
                  }`}
                />
                <span
                  className={`text-[8px] font-semibold text-center max-w-[52px] leading-tight ${
                    i <= j.stage ? 'text-white/85' : 'text-white/35'
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
        <p className="text-[9px] font-bold tracking-widest uppercase text-white/35">Journeys</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {journeys.map((x, i) => {
          const isActive = !isEmbed && i === active;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`group relative w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                isActive ? 'bg-white/10' : 'hover:bg-white/[0.06]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-2 bottom-2 w-0.5 bg-brand rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span
                className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors border ${
                  isActive
                    ? 'bg-white text-brand border-white'
                    : 'bg-white/10 text-white border-white/20 group-hover:bg-white/15 group-hover:border-white/30'
                } ${x.parallel ? 'ring-1 ring-dashed ring-white/25' : ''}`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={`text-[13px] font-semibold leading-snug transition-colors ${
                    isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                  }`}
                >
                  {x.title}
                </p>
                <p className={`text-[11px] mt-1 leading-tight ${isActive ? 'text-white/60' : 'text-white/55 group-hover:text-white/70'}`}>
                  {x.parallel ? 'Runs in background' : stages[x.stage]}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-3 space-y-0.5">
        <p className="px-3 pb-2 text-[9px] font-bold tracking-widest uppercase text-white/35">Demo</p>
        <DemoNavButton
          active={view === VIEW.MARIANATEK_FINDINGS}
          onClick={onSelectMarianaTekFindings}
          icon={Database}
          title="Mariana Tek Data"
          subtitle="Analysis & findings report"
        />
        <DemoNavButton
          active={view === VIEW.STUDIO_DEMO}
          onClick={onSelectStudioDemo}
          icon={Smartphone}
          title="Studio Journey Demo"
          subtitle="SMS walkthrough + ops view"
        />
      </div>

      <div className="px-5 py-3.5 border-t border-white/8">
        <p className="text-[10px] text-white/30 leading-relaxed">
          {view === VIEW.MARIANATEK_FINDINGS && 'Mariana Tek data analysis and studio insights'}
          {view === VIEW.STUDIO_DEMO && 'Interactive phone demo with Mariana Tek booking flow'}
          {view === VIEW.JOURNEY && (
            <>Use <kbd className="font-sans text-white/45">←</kbd>{' '}
            <kbd className="font-sans text-white/45">→</kbd> to move between journeys</>
          )}
        </p>
      </div>
    </aside>
  );
}
