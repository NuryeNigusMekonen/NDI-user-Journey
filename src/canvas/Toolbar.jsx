import { motion } from 'framer-motion';
import {
  MousePointer2, Hand, MessageCircle, Pencil, Highlighter, Eraser,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, PenLine, LayoutGrid, Type, Save, Braces,
} from 'lucide-react';
import { TOOL, CANVAS_MODE } from '../types/diagram';

function ToolButton({ icon: Icon, label, active, onClick, disabled }) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 ${
        active ? 'bg-brand text-white shadow-sm' : 'text-[#374151] hover:bg-[#F3F4F6]'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function IconButton({ icon: Icon, title, onClick, disabled }) {
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

export default function Toolbar({
  activeTool, onToolChange, canvasMode, onCanvasModeChange,
  isEdit, onUndo, onRedo, canUndo, canRedo, onZoomIn, onZoomOut, onFit,
  onSave, saveStatus, codePanelOpen, onCodePanelToggle, showAdvanced,
}) {
  const diagramTools = isEdit
    ? [
      { id: TOOL.POINTER, icon: MousePointer2, label: 'Select' },
      { id: TOOL.HAND, icon: Hand, label: 'Move' },
      { id: TOOL.TEXT, icon: Type, label: 'Text' },
    ]
    : [
      { id: TOOL.POINTER, icon: MousePointer2, label: 'Select' },
      { id: TOOL.HAND, icon: Hand, label: 'Move' },
    ];

  const drawTools = [
    { id: TOOL.PENCIL, icon: Pencil, label: 'Pen' },
    { id: TOOL.HIGHLIGHTER, icon: Highlighter, label: 'Highlight' },
    { id: TOOL.ERASER, icon: Eraser, label: 'Eraser' },
    { id: TOOL.HAND, icon: Hand, label: 'Move' },
  ];

  const activeTools = canvasMode === CANVAS_MODE.DRAW ? drawTools : diagramTools;

  const saveLabel = saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'saved' ? 'Saved'
      : saveStatus === 'error' ? 'Save failed'
        : saveStatus === 'pending' ? 'Unsaved'
          : 'Save';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/95 border border-[#E8E6DF] shadow-sm max-w-[95vw] overflow-x-auto"
      >
        <ToolButton
          icon={LayoutGrid}
          label="Map"
          active={canvasMode === CANVAS_MODE.DIAGRAM}
          onClick={() => onCanvasModeChange(CANVAS_MODE.DIAGRAM)}
        />
        {isEdit && (
          <ToolButton
            icon={PenLine}
            label="Sketch"
            active={canvasMode === CANVAS_MODE.DRAW}
            onClick={() => onCanvasModeChange(CANVAS_MODE.DRAW)}
          />
        )}
        <div className="w-px h-6 bg-[#E8E6DF] mx-0.5 shrink-0" />
        {activeTools.map(({ id, icon, label }) => (
          <ToolButton
            key={id}
            icon={icon}
            label={label}
            active={activeTool === id}
            onClick={() => onToolChange(id)}
          />
        ))}
        <div className="w-px h-6 bg-[#E8E6DF] mx-0.5 shrink-0" />
        <ToolButton icon={MessageCircle} label="Comment" active={activeTool === TOOL.COMMENT} onClick={() => onToolChange(TOOL.COMMENT)} />
        {isEdit && onSave && (
          <ToolButton icon={Save} label={saveLabel} onClick={onSave} />
        )}
        {showAdvanced && isEdit && (
          <ToolButton icon={Braces} label="Code" active={codePanelOpen} onClick={onCodePanelToggle} />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-0.5 p-1 rounded-xl bg-white/90 border border-[#E8E6DF] shadow-sm"
      >
        <IconButton icon={Undo2} title="Undo" disabled={!canUndo} onClick={onUndo} />
        <IconButton icon={Redo2} title="Redo" disabled={!canRedo} onClick={onRedo} />
        <div className="h-px bg-[#E8E6DF] mx-1 my-0.5" />
        <IconButton icon={ZoomIn} title="Zoom in" onClick={onZoomIn} />
        <IconButton icon={ZoomOut} title="Zoom out" onClick={onZoomOut} />
        <IconButton icon={Maximize2} title="Fit to screen" onClick={onFit} />
      </motion.div>
    </>
  );
}
