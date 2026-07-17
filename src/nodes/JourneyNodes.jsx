import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import { GitBranch, Zap, MessageSquare, Server, Database } from 'lucide-react';
import { resolveActor, getActorIds } from '../lib/actors';
import { useDiagramStore } from '../store/diagramStore';
import InlineEdit from '../canvas/InlineEdit';
import { useNodeActions, SELECT_RING, HOVER_RING } from './BaseNode';
import ConnectionPorts, { SIDE_PORTS } from './ConnectionPorts';
import DecisionPorts from './DecisionPorts';
import { STEP_KIND, STEP_KIND_META } from '../types/journeySemantics';

const colorBar = { sky: 'bg-sky', brand: 'bg-brand', slate: 'bg-slate', amber: 'bg-amber', teal: 'bg-teal' };
const colorText = {
  sky: 'text-sky',
  brand: 'text-brand',
  slate: 'text-slate',
  amber: 'text-amber',
  teal: 'text-teal',
};

const KIND_ICONS = {
  message: MessageSquare,
  system: Server,
  handoff: Database,
};

function ActorRow({ id, data, isEdit, selected, updateNode }) {
  const nodes = useDiagramStore((s) => s.nodes);
  const actorIds = getActorIds(nodes);
  const from = resolveActor(data.from);
  const to = resolveActor(data.to);
  const icons = { lead: MessageSquare, ai: Server, mt: Database, mgr: GitBranch, ghl: Zap };
  const FIcon = icons[data.from] || MessageSquare;
  const TIcon = icons[data.to] || MessageSquare;
  const fromShort = data.fromLabel ?? from?.short ?? data.from;
  const toShort = data.toLabel ?? to?.short ?? data.to;

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 min-w-0">
        <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold ${colorText[from?.color] || 'text-brand'}`}>
          <FIcon className="w-2.5 h-2.5 shrink-0" />
          {isEdit && !selected ? (
            <span className="truncate max-w-[80px]">{fromShort}</span>
          ) : (
            <InlineEdit
              value={fromShort}
              onChange={(v) => updateNode(id, { fromLabel: v })}
              enabled={isEdit && selected}
              className="truncate max-w-[80px]"
              placeholder="Who starts"
            />
          )}
        </span>
        <span className="text-ink-muted text-[10px]">→</span>
        <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold ${colorText[to?.color] || 'text-brand'}`}>
          <TIcon className="w-2.5 h-2.5 shrink-0" />
          {isEdit && !selected ? (
            <span className="truncate max-w-[80px]">{toShort}</span>
          ) : (
            <InlineEdit
              value={toShort}
              onChange={(v) => updateNode(id, { toLabel: v })}
              enabled={isEdit && selected}
              className="truncate max-w-[80px]"
              placeholder="Who receives"
            />
          )}
        </span>
      </div>
      {isEdit && selected && (
        <div className="flex items-center gap-1.5 mt-1" onMouseDown={(e) => e.stopPropagation()}>
          <span className="text-[8px] text-ink-muted shrink-0">From</span>
          <select
            value={data.from}
            onChange={(e) => updateNode(id, { from: e.target.value })}
            className="text-[9px] font-medium rounded border border-hairline bg-surface-raised text-ink px-1 py-0.5 flex-1 min-w-0"
          >
            {actorIds.map((aid) => (
              <option key={aid} value={aid}>{resolveActor(aid).short}</option>
            ))}
          </select>
          <span className="text-[8px] text-ink-muted">→</span>
          <select
            value={data.to}
            onChange={(e) => updateNode(id, { to: e.target.value })}
            className="text-[9px] font-medium rounded border border-hairline bg-surface-raised text-ink px-1 py-0.5 flex-1 min-w-0"
          >
            {actorIds.map((aid) => (
              <option key={aid} value={aid}>{resolveActor(aid).short}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export const StepNode = memo(function StepNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  const from = resolveActor(data.from);
  const kind = data.kind || (data.dashed ? 'system' : 'message');
  const meta = STEP_KIND_META[kind] || STEP_KIND_META.message;
  const KindIcon = KIND_ICONS[kind] || MessageSquare;

  return (
    <>
      {isEdit && <NodeResizer minWidth={180} minHeight={88} isVisible={selected} />}
      <ConnectionPorts sides={SIDE_PORTS} />
      <div
        className={`rounded-xl overflow-hidden transition-all ${HOVER_RING} ${selected ? SELECT_RING : ''} ${meta.border} ${meta.bg}`}
        style={{ width: 228, boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}
      >
        <div className={`h-1 ${colorBar[from?.color] || 'bg-brand'}`} />
        <div className="px-3 py-2.5">
      {isEdit && selected && (
        <div className="mb-1.5" onMouseDown={(e) => e.stopPropagation()}>
          <span className="text-[8px] text-ink-muted block mb-0.5">Step type</span>
          <select
            value={kind}
            onChange={(e) => updateNode(id, { kind: e.target.value })}
            className="w-full text-[10px] font-medium rounded border border-hairline bg-surface-raised text-ink px-1.5 py-1"
          >
            {Object.entries(STEP_KIND_META).map(([k, m]) => (
              <option key={k} value={k}>{m.editLabel || m.label}</option>
            ))}
          </select>
        </div>
      )}
      {!isEdit && (
        <div className="flex items-center justify-between mb-1.5 gap-1">
          <span className="text-[9px] font-bold text-brand tabular-nums">
            {data.stepLabel ?? (data.stepNum != null ? `Step ${data.stepNum}` : 'Step')}
          </span>
          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${meta.badge}`}>
            <KindIcon className="w-2.5 h-2.5" />
            {data.kindLabel ?? meta.short}
          </span>
        </div>
      )}
      <ActorRow id={id} data={data} isEdit={isEdit} selected={selected} updateNode={updateNode} />
      {!isEdit && data.dashed && (
        <span className="inline-flex items-center gap-0.5 text-[8px] text-ink-muted mt-1">
          <Zap className="w-2.5 h-2.5" />
          {data.automatedLabel ?? 'Automated'}
        </span>
      )}
      <InlineEdit
        value={data.text}
        onChange={(v) => updateNode(id, { text: v })}
        enabled={isEdit}
        multiline
        className="text-[11px] text-ink mt-1 block leading-snug font-medium"
        placeholder="Describe what happens…"
      />
      {isEdit && selected && (
        <InlineEdit
          value={data.description || ''}
          onChange={(v) => updateNode(id, { description: v })}
          enabled={isEdit}
          multiline
          className="text-[10px] text-ink-muted mt-1 block leading-snug"
          placeholder="Extra details (optional)"
        />
      )}
        </div>
      </div>
    </>
  );
});

export const NoteNode = memo(function NoteNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  const isSide = !!data.anchor;
  return (
    <>
      {isEdit && <NodeResizer minWidth={160} minHeight={48} isVisible={selected} />}
      <ConnectionPorts sides={SIDE_PORTS} />
      <div className={`rounded-xl border px-3 py-2.5 transition-all ${HOVER_RING} ${selected ? SELECT_RING : ''} ${isSide ? 'bg-brand/10 border-brand/30 text-brand/90' : 'bg-surface-raised border-hairline text-ink'}`} style={{ width: 228 }}>
        <InlineEdit value={data.text} onChange={(v) => updateNode(id, { text: v })} enabled={isEdit} multiline className={`text-[11px] leading-snug block ${isSide ? '' : 'font-semibold text-center'}`} placeholder="Section title…" />
      </div>
    </>
  );
});

export const ForkNode = memo(function ForkNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  const title = data?.title || 'What are the options?';

  return (
    <div className="relative flex flex-col items-center w-[140px]">
      <div className="relative w-[130px] h-[130px] flex items-center justify-center">
        <DecisionPorts />
        <div
          className={`absolute inset-3 rotate-45 rounded-sm border-2 ${
            selected ? 'border-brand bg-brand/20' : 'border-brand/70 bg-surface'
          }`}
          style={{ boxShadow: '0 0 16px rgba(56,189,248,.25)' }}
        />
        <div className="relative z-10 text-center px-1 max-w-[80px]">
          <span className="text-[8px] font-bold text-brand block">OR</span>
          <GitBranch className="w-4 h-4 text-brand mx-auto my-0.5" />
        </div>
      </div>
      <div className="mt-1 w-full text-center px-1">
        <InlineEdit
          value={title}
          onChange={(v) => updateNode(id, { title: v })}
          enabled={isEdit}
          className="text-[9px] font-semibold text-brand leading-tight block"
          placeholder="What are the options?"
        />
        {isEdit && selected && (
          <InlineEdit
            value={data.description || ''}
            onChange={(v) => updateNode(id, { description: v })}
            enabled={isEdit}
            multiline
            className="text-[9px] text-ink-muted leading-snug block mt-1"
            placeholder="Explain each path (optional)"
          />
        )}
      </div>
    </div>
  );
});
