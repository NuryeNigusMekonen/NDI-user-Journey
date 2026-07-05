import {
  MousePointer2, Hand, MessageCircle, Pencil, Highlighter, Eraser,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Type, Braces, Eye, X, Check,
} from 'lucide-react';
import { useMemo } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { TOOL, WORKSPACE_MODE } from '../types/diagram';

function Btn({ icon: Icon, label, active, onClick, disabled, compact }) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 ${
        compact ? 'px-2 py-1.5' : 'px-2.5 py-1.5'
      } ${active ? 'bg-brand text-white shadow-sm' : 'text-[#374151] hover:bg-[#F3F4F6]'}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function IconBtn({ icon: Icon, title, onClick, disabled }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-30"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default function WorkspaceToolbar({
  workspaceMode,
  onWorkspaceModeChange,
}) {
  const api = useWorkspaceStore((s) => s.api);
  const activeTool = useDiagramStore((s) => s.activeTool);
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const comments = useDiagramStore((s) => s.comments);
  const annotations = useDiagramStore((s) => s.annotations);
  const mermaidSource = useDiagramStore((s) => s.mermaidSource);
  const editBaseline = useDiagramStore((s) => s.editBaseline);
  const canUndo = useDiagramStore((s) => s.past.length > 0);
  const canRedo = useDiagramStore((s) => s.future.length > 0);

  const hasEditChanges = useMemo(() => {
    if (!editBaseline) return false;
    return useDiagramStore.getState().hasEditChanges();
  }, [nodes, edges, comments, annotations, mermaidSource, editBaseline]);

  const isEdit = workspaceMode === WORKSPACE_MODE.EDIT;
  const setTool = (t) => useDiagramStore.getState().setActiveTool(t);
  const saving = api?.saveStatus === 'saving';

  const tools = [
    { id: TOOL.POINTER, icon: MousePointer2, label: 'Select' },
    { id: TOOL.HAND, icon: Hand, label: 'Move' },
    { id: TOOL.PENCIL, icon: Pencil, label: 'Pen' },
    { id: TOOL.HIGHLIGHTER, icon: Highlighter, label: 'Highlight' },
    { id: TOOL.ERASER, icon: Eraser, label: 'Eraser' },
    ...(isEdit ? [{ id: TOOL.TEXT, icon: Type, label: 'Text' }] : []),
  ];

  const switchToView = () => {
    if (isEdit && hasEditChanges) {
      if (!window.confirm('Discard unsaved changes?')) return;
      api?.cancelChanges?.();
      return;
    }
    if (isEdit) {
      api?.cancelChanges?.();
      return;
    }
    onWorkspaceModeChange(WORKSPACE_MODE.VIEW);
  };

  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <div className="flex items-center gap-1 flex-wrap min-w-0">
        {tools.map(({ id, icon, label }) => (
          <Btn key={id} icon={icon} label={label} active={activeTool === id} onClick={() => setTool(id)} />
        ))}

        <span className="w-px h-6 bg-line shrink-0" />

        <Btn icon={MessageCircle} label="Comment" active={activeTool === TOOL.COMMENT} onClick={() => setTool(TOOL.COMMENT)} />

        <span className="w-px h-6 bg-line shrink-0" />

        {isEdit && (
          <>
            <IconBtn icon={Undo2} title="Undo" disabled={!canUndo} onClick={() => useDiagramStore.getState().undo()} />
            <IconBtn icon={Redo2} title="Redo" disabled={!canRedo} onClick={() => useDiagramStore.getState().redo()} />
            <span className="w-px h-6 bg-line shrink-0" />
          </>
        )}

        <IconBtn icon={ZoomIn} title="Zoom in" onClick={() => api?.zoomIn?.()} disabled={!api} />
        <IconBtn icon={ZoomOut} title="Zoom out" onClick={() => api?.zoomOut?.()} disabled={!api} />
        <IconBtn icon={Maximize2} title="Fit to screen" onClick={() => api?.fitView?.()} disabled={!api} />

        {isEdit && (
          <>
            <span className="w-px h-6 bg-line shrink-0" />
            <Btn icon={Braces} label="Code" active={api?.codePanelOpen} onClick={() => api?.toggleCodePanel?.()} />
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isEdit && (
          <>
            <button
              type="button"
              onClick={() => api?.cancelChanges?.()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink-muted hover:bg-white hover:text-ink transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => api?.saveChanges?.()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors disabled:opacity-60 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <span className="w-px h-6 bg-line shrink-0 hidden sm:block" />
          </>
        )}

        <div className="flex items-center p-0.5 rounded-lg bg-cream border border-line">
          <button
            type="button"
            onClick={switchToView}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              workspaceMode === WORKSPACE_MODE.VIEW ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <button
            type="button"
            onClick={() => onWorkspaceModeChange(WORKSPACE_MODE.EDIT)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              workspaceMode === WORKSPACE_MODE.EDIT ? 'bg-brand text-white shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}
