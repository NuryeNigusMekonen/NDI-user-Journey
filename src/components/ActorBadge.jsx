import {
  User,
  Bot,
  Calendar,
  Users,
  BarChart3,
  Zap,
} from 'lucide-react';
import { participants } from '../data/journeys';
import { AUTO_HINT, AUTO_LABEL } from '../lib/actors';

const icons = {
  lead: User,
  ai: Bot,
  mt: Calendar,
  mgr: Users,
  ghl: BarChart3,
};

const colorMap = {
  sky: 'bg-sky-light text-sky border-sky/15',
  brand: 'bg-brand-light text-brand border-brand/15',
  slate: 'bg-slate-light text-slate border-slate/15',
  amber: 'bg-amber-light text-amber border-amber/15',
  teal: 'bg-teal-light text-teal border-teal/15',
};

const dotMap = {
  sky: 'bg-sky',
  brand: 'bg-brand',
  slate: 'bg-slate',
  amber: 'bg-amber',
  teal: 'bg-teal',
};

export function ActorBadge({ actorId, size = 'md' }) {
  const actor = participants[actorId];
  const Icon = icons[actorId];
  const compact = size === 'sm';

  return (
    <span
      title={actor.description}
      className={`inline-flex items-center gap-1.5 font-semibold border rounded-lg ${
        colorMap[actor.color]
      } ${compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
    >
      <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {actor.label}
    </span>
  );
}

export function ActorMini({ fromId, toId }) {
  const from = participants[fromId];
  const to = participants[toId];
  const FromIcon = icons[fromId];
  const ToIcon = icons[toId];

  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold ${colorMap[from.color].split(' ').slice(1).join(' ')}`}>
        <FromIcon className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate max-w-[72px]">{from.short}</span>
      </span>
      <span className="text-ink-muted text-[10px]">→</span>
      <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold ${colorMap[to.color].split(' ').slice(1).join(' ')}`}>
        <ToIcon className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate max-w-[72px]">{to.short}</span>
      </span>
    </div>
  );
}

export function ActorFlow({ fromId, toId, dashed, size = 'md' }) {
  const large = size === 'lg';

  return (
    <div className={large ? 'space-y-2' : 'space-y-1'}>
      <div className="flex items-center gap-2 flex-wrap">
        <ActorBadge actorId={fromId} size={large ? 'md' : 'sm'} />
        <span className="text-ink-muted text-sm">{dashed ? 'updates' : '→'}</span>
        <ActorBadge actorId={toId} size={large ? 'md' : 'sm'} />
        {dashed && (
          <span
            title={AUTO_HINT}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate bg-slate-light border border-slate/15 rounded-md px-2 py-0.5"
          >
            <Zap className="w-3 h-3" />
            {AUTO_LABEL}
          </span>
        )}
      </div>
      {large && (
        <p className="text-xs text-ink-muted leading-relaxed">
          {participants[fromId].description}
          {!dashed && (
            <>
              {' '}
              <span className="text-line">·</span> {participants[toId].description}
            </>
          )}
        </p>
      )}
    </div>
  );
}

export function ActorLegend({ compact = false }) {
  return (
    <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {Object.values(participants).map((p) => {
        const Icon = icons[p.id];
        return (
          <span
            key={p.id}
            title={p.description}
            className={`inline-flex items-center gap-1.5 bg-white/95 backdrop-blur border border-line rounded-full shadow-sm font-medium text-ink ${
              compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotMap[p.color]}`} />
            <Icon className="w-3 h-3 text-ink-muted shrink-0" />
            {p.label}
          </span>
        );
      })}
    </div>
  );
}
