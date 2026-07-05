import { motion } from 'framer-motion';
import { GitBranch, ChevronRight } from 'lucide-react';
import { ActorFlow } from './ActorBadge';
import { participants } from '../data/journeys';

const colorBar = {
  sky: 'bg-sky',
  brand: 'bg-brand',
  slate: 'bg-slate',
  amber: 'bg-amber',
  teal: 'bg-teal',
};

export function StepCard({ data, stepNum, large = false }) {
  const from = participants[data.from];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border bg-white shadow-card overflow-hidden w-full border-line ${
        large ? 'max-w-xl' : 'max-w-lg'
      }`}
    >
      <div className={`h-1 ${colorBar[from.color]}`} />
      <div className={large ? 'px-8 py-8' : 'p-5'}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-display font-bold text-lg shrink-0">
            {stepNum}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Step {stepNum}</p>
            <ActorFlow fromId={data.from} toId={data.to} dashed={data.dashed} size="md" />
          </div>
        </div>
        <p className={`leading-relaxed text-ink ${large ? 'text-lg' : 'text-base'}`}>{data.text}</p>
      </div>
    </motion.div>
  );
}

export function NoteCard({ data, large = false }) {
  const isSide = !!data.anchor;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border w-full ${
        isSide
          ? 'bg-brand-light border-brand/20 text-navy max-w-lg'
          : 'bg-ink border-ink text-white max-w-xl text-center'
      } ${large ? 'px-8 py-8' : 'px-5 py-5'}`}
    >
      <p className={`leading-relaxed ${isSide ? 'text-base text-left' : 'font-display font-semibold text-xl'}`}>
        {data.text.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < data.text.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
    </motion.div>
  );
}

export function DecisionCard({ branches, onSelectBranch, large = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full ${large ? 'max-w-xl' : 'max-w-lg'}`}
    >
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-light border border-brand/20 flex items-center justify-center mx-auto mb-4">
          <GitBranch className="w-6 h-6 text-brand" />
        </div>
        <h3 className="font-display text-xl font-semibold text-navy">What happens next?</h3>
        <p className="text-sm text-ink-muted mt-1">Choose the scenario you want to explore</p>
      </div>
      <div className="space-y-3">
        {branches.map((b, i) => (
          <button
            key={i}
            onClick={() => onSelectBranch(i)}
            className={`w-full text-left rounded-2xl border bg-white p-5 hover:border-brand hover:shadow-card transition-all group ${
              b.else ? 'border-line' : 'border-brand/25'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className={`text-[10px] font-bold tracking-wide ${b.else ? 'text-slate' : 'text-brand'}`}>
                  {b.else ? 'If this does not happen' : 'When this happens'}
                </span>
                <p className="text-base font-semibold text-ink mt-1 leading-snug">{b.label}</p>
                <p className="text-xs text-ink-muted mt-1.5">
                  {b.stepCount} step{b.stepCount !== 1 ? 's' : ''} in this scenario
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-muted group-hover:text-brand shrink-0 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function StepRow({ data, stepNum }) {
  return (
    <div className="flex gap-3 py-3 border-b border-line last:border-0">
      <span className="text-[10px] font-bold text-brand bg-brand-light w-7 h-7 rounded-md flex items-center justify-center shrink-0">
        {stepNum}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5">
          <ActorFlow fromId={data.from} toId={data.to} dashed={data.dashed} size="sm" />
        </div>
        <p className="text-sm text-ink leading-relaxed">{data.text}</p>
      </div>
    </div>
  );
}
