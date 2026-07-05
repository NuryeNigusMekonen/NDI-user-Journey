import { useState } from 'react';
import {
  User, Play, Square, Monitor, Workflow, GitBranch,
  ArrowLeftRight, StickyNote, Layers,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import InlineEdit from '../components/InlineEdit';
import { NodeShell, useNodeEdit } from './shared';

export function UserNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();

  return (
    <NodeShell id={id} data={data} selected={selected} className="rounded-2xl" width={200} minWidth={160} minHeight={110}>
      <div className="flex items-start gap-3 p-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-light to-white border-2 border-brand/15 flex items-center justify-center">
            <User className="w-5 h-5 text-brand" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <InlineEdit value={data.name} onChange={(v) => updateNode(id, { name: v })} enabled={isEditMode} className="text-sm font-bold text-ink block" placeholder="User name" />
          <InlineEdit value={data.role} onChange={(v) => updateNode(id, { role: v })} enabled={isEditMode} className="text-[11px] text-brand font-semibold block mt-0.5" placeholder="Role label" />
          <InlineEdit value={data.description} onChange={(v) => updateNode(id, { description: v })} enabled={isEditMode} multiline className="text-[10px] text-ink-muted mt-1 block leading-snug" placeholder="Description" />
        </div>
      </div>
    </NodeShell>
  );
}

export function TerminalNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();
  const isEnd = data.variant === 'end';

  return (
    <NodeShell id={id} data={data} selected={selected} className="rounded-full" minWidth={120} minHeight={48}>
      <div className={`flex items-center justify-center gap-2 px-5 py-2.5 ${isEnd ? 'bg-ink text-white rounded-full' : 'rounded-full'}`}
        style={{ backgroundColor: isEnd ? undefined : data.style?.backgroundColor }}>
        {!isEnd && <Play className="w-3.5 h-3.5 text-brand fill-brand/20" />}
        <InlineEdit value={data.title} onChange={(v) => updateNode(id, { title: v })} enabled={isEditMode} className={`text-xs font-bold ${isEnd ? 'text-white' : 'text-ink'}`} placeholder={isEnd ? 'End' : 'Start'} />
        {isEnd && <Square className="w-3 h-3 text-white/80" />}
      </div>
    </NodeShell>
  );
}

export function ScreenNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();
  const mobile = data.device === 'mobile';

  return (
    <NodeShell id={id} data={data} selected={selected} className="rounded-xl overflow-hidden" width={mobile ? 160 : 220} minWidth={140} minHeight={mobile ? 200 : 160}>
      <div className="bg-cream/60 border-b border-line/60 px-2.5 py-1.5 flex items-center gap-1.5">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-brand/40" />
          <span className="w-2 h-2 rounded-full bg-amber/50" />
          <span className="w-2 h-2 rounded-full bg-teal/50" />
        </div>
        <div className="flex-1 h-4 rounded-md bg-white/80 border border-line/50 flex items-center px-2">
          <InlineEdit value={data.subtitle || data.url || ''} onChange={(v) => updateNode(id, { subtitle: v })} enabled={isEditMode} className="text-[8px] text-ink-muted truncate" placeholder="/page-url" />
        </div>
      </div>
      <div className="p-3 flex flex-col items-center text-center gap-2">
        {mobile ? <Monitor className="w-5 h-5 text-brand/70 rotate-90" /> : <Monitor className="w-5 h-5 text-brand/70" />}
        <InlineEdit value={data.title} onChange={(v) => updateNode(id, { title: v })} enabled={isEditMode} className="text-xs font-bold text-ink" placeholder="Screen title" />
        <InlineEdit value={data.description} onChange={(v) => updateNode(id, { description: v })} enabled={isEditMode} multiline className="text-[10px] text-ink-muted leading-snug" placeholder="What happens on this screen?" />
      </div>
    </NodeShell>
  );
}

export function ProcessNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();

  return (
    <NodeShell id={id} data={data} selected={selected} className="rounded-2xl" width={200} minWidth={150} minHeight={72}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-6 h-6 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
            <Workflow className="w-3.5 h-3.5 text-brand" />
          </span>
          <InlineEdit value={data.title} onChange={(v) => updateNode(id, { title: v })} enabled={isEditMode} className="text-xs font-bold text-ink" placeholder="Action" />
        </div>
        <InlineEdit value={data.subtitle} onChange={(v) => updateNode(id, { subtitle: v })} enabled={isEditMode} className="text-[10px] text-brand font-medium block mb-1" placeholder="Subtitle" />
        <InlineEdit value={data.description} onChange={(v) => updateNode(id, { description: v })} enabled={isEditMode} multiline className="text-[10px] text-ink-muted leading-snug block" placeholder="Description" />
      </div>
    </NodeShell>
  );
}

export function DecisionNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();

  return (
    <NodeShell id={id} data={data} selected={selected} resizable={false} minWidth={100} minHeight={100}>
      <div className="relative w-[120px] h-[120px] flex items-center justify-center">
        <div
          className={`absolute inset-3 rotate-45 rounded-xl border-2 flex items-center justify-center transition-colors ${
            selected ? 'bg-brand border-brand text-white' : 'bg-brand-light/60 border-brand/40 text-brand'
          }`}
        >
          <GitBranch className="w-4 h-4 -rotate-45" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-[100px]">
          <InlineEdit value={data.title} onChange={(v) => updateNode(id, { title: v })} enabled={isEditMode} className="text-[10px] font-bold text-ink leading-tight" placeholder="Condition?" />
        </div>
      </div>
    </NodeShell>
  );
}

export function IoNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();

  return (
    <NodeShell id={id} data={data} selected={selected} resizable={false} minWidth={160} minHeight={72}>
      <div className="relative w-[180px] h-[72px] flex items-center justify-center">
        <div
          className="absolute inset-0 border-2 rounded-lg"
          style={{
            backgroundColor: data.style?.backgroundColor || '#fff',
            borderColor: data.style?.borderColor || '#E2E0D8',
            transform: 'skewX(-12deg)',
          }}
        />
        <div className="relative z-10 flex items-center gap-2 px-4" style={{ transform: 'skewX(0deg)' }}>
          <ArrowLeftRight className="w-3.5 h-3.5 text-brand shrink-0" />
          <div className="min-w-0">
            <InlineEdit value={data.title} onChange={(v) => updateNode(id, { title: v })} enabled={isEditMode} className="text-xs font-bold text-ink block" placeholder="Input / Output" />
            <InlineEdit value={data.description} onChange={(v) => updateNode(id, { description: v })} enabled={isEditMode} className="text-[10px] text-ink-muted block" placeholder="Details" />
          </div>
        </div>
      </div>
    </NodeShell>
  );
}

export function StickyNoteNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();
  const [preview, setPreview] = useState(false);

  return (
    <NodeShell id={id} data={data} selected={selected} handles={false} className="rounded-xl" minWidth={140} minHeight={120}>
      <div
        className="h-full w-full rounded-xl"
        style={{ backgroundColor: data.color || '#fff9c4', minWidth: 160, minHeight: 120 }}
        onDoubleClick={(e) => { if (!isEditMode) return; e.stopPropagation(); setPreview((p) => !p); }}
      >
        <div className="p-3 h-full flex flex-col">
          <div className="flex items-center gap-1.5 mb-1.5 text-ink-muted">
            <StickyNote className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Note</span>
          </div>
          {preview && !isEditMode ? (
            <div className="text-sm text-ink prose prose-sm max-w-none flex-1 overflow-auto">
              <ReactMarkdown>{data.text || '*Empty note*'}</ReactMarkdown>
            </div>
          ) : (
            <InlineEdit
              value={data.text}
              onChange={(v) => updateNode(id, { text: v })}
              enabled={isEditMode}
              multiline
              className="text-sm text-ink leading-relaxed block flex-1"
              placeholder="UX observation… (supports **markdown**)"
            />
          )}
        </div>
      </div>
    </NodeShell>
  );
}

export function GroupNode({ id, data, selected }) {
  const { isEditMode, updateNode } = useNodeEdit();

  return (
    <NodeShell
      id={id}
      data={data}
      selected={selected}
      handles={false}
      className="rounded-2xl border-dashed"
      style={{ width: '100%', height: '100%', minWidth: 280, minHeight: 200 }}
      minWidth={240}
      minHeight={160}
    >
      <div className="absolute top-0 left-0 right-0 px-3 py-2 border-b border-line/40 bg-white/50 rounded-t-2xl">
        <InlineEdit value={data.title} onChange={(v) => updateNode(id, { title: v })} enabled={isEditMode} className="text-[11px] font-bold text-ink-muted uppercase tracking-wider" placeholder="Section name" />
        <InlineEdit value={data.description} onChange={(v) => updateNode(id, { description: v })} enabled={isEditMode} className="text-[10px] text-ink-muted/70 block mt-0.5" placeholder="Group description" />
      </div>
    </NodeShell>
  );
}
