import { Handle, Position, NodeResizer } from '@xyflow/react';
import { GitBranch, Zap } from 'lucide-react';
import InlineEdit from '../components/InlineEdit';
import { useNodeEdit, resolveStyle } from './shared';
import { participants } from '../../data/journeys';
import { ActorMini } from '../../components/ActorBadge';

const colorBar = {
  sky: 'bg-sky',
  brand: 'bg-brand',
  slate: 'bg-slate',
  amber: 'bg-amber',
  teal: 'bg-teal',
};

export function EditableStepNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();
  const st = resolveStyle(data);
  const from = participants[data.from];

  return (
    <>
      {isEditMode && <NodeResizer minWidth={180} minHeight={72} isVisible={selected} />}
      <Handle type="target" position={Position.Left} className="ux-handle" />
      <div
        className={`rounded-xl border bg-white overflow-hidden transition-all duration-200 ${
          selected ? 'ring-2 ring-brand/35 shadow-glow' : 'shadow-sm hover:shadow-card hover:-translate-y-px'
        } ${data.dashed ? 'border-dashed' : ''}`}
        style={{ width: 228, borderColor: st.borderColor, boxShadow: st.boxShadow }}
      >
        <div className={`h-0.5 ${colorBar[from?.color] || 'bg-brand'}`} />
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[9px] font-bold text-brand">Step {data.stepNum}</span>
            {data.dashed && <Zap className="w-3 h-3 text-slate shrink-0" />}
          </div>
          <div className="mb-1.5"><ActorMini fromId={data.from} toId={data.to} /></div>
          <InlineEdit value={data.text} onChange={(v) => updateNode(id, { text: v })} enabled={isEditMode} multiline className="text-[11px] text-ink leading-snug block" placeholder="Step description" />
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="ux-handle" />
    </>
  );
}

export function EditableNoteNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();
  const isSide = !!data.anchor;

  return (
    <>
      {isEditMode && <NodeResizer minWidth={160} minHeight={48} isVisible={selected} />}
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <div
        className={`rounded-xl border px-3 py-2.5 transition-all duration-200 ${
          selected ? 'ring-2 ring-brand/35 shadow-glow' : 'shadow-sm hover:shadow-card'
        } ${isSide ? 'bg-brand-light border-brand/20 text-ink' : 'bg-ink border-ink text-white'}`}
        style={{ width: 228 }}
      >
        <InlineEdit value={data.text} onChange={(v) => updateNode(id, { text: v })} enabled={isEditMode} multiline className={`text-[11px] leading-snug block ${isSide ? '' : 'font-display font-semibold text-center'}`} placeholder="Note" />
      </div>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </>
  );
}

export function EditableForkNode({ selected }) {
  return (
    <div className="flex items-center justify-center w-[72px] h-[72px]">
      <Handle type="target" position={Position.Left} className="ux-handle" />
      <div className={`w-9 h-9 rotate-45 rounded-lg border-2 flex items-center justify-center transition-all ${
        selected ? 'bg-brand border-brand text-white shadow-glow' : 'bg-brand-light border-brand text-brand hover:shadow-card'
      }`}>
        <GitBranch className="w-3.5 h-3.5 -rotate-45" />
      </div>
      <Handle type="source" position={Position.Right} className="ux-handle" />
    </div>
  );
}
