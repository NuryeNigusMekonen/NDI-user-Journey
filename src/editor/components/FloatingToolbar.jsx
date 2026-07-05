import { motion } from 'framer-motion';
import {
  MousePointer2, Hand, MessageCircle, StickyNote, Type, Pencil, Highlighter,
  Eraser, Square, Circle, ArrowRight, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';
import { TOOL } from '../constants';

const EDIT_TOOLS = [
  { id: TOOL.POINTER, icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: TOOL.HAND, icon: Hand, label: 'Pan', shortcut: 'H' },
  { id: 'sep1' },
  { id: TOOL.COMMENT, icon: MessageCircle, label: 'Comment', shortcut: 'C' },
  { id: TOOL.STICKY, icon: StickyNote, label: 'Sticky note', shortcut: 'N' },
  { id: TOOL.TEXT, icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'sep2' },
  { id: TOOL.PENCIL, icon: Pencil, label: 'Pencil', shortcut: 'P' },
  { id: TOOL.HIGHLIGHTER, icon: Highlighter, label: 'Highlighter', shortcut: 'B' },
  { id: TOOL.ERASER, icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { id: 'sep3' },
  { id: TOOL.RECT, icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: TOOL.CIRCLE, icon: Circle, label: 'Circle', shortcut: 'O' },
  { id: TOOL.ARROW, icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  { id: 'sep4' },
  { id: 'undo', icon: Undo2, label: 'Undo', shortcut: '⌘Z' },
  { id: 'redo', icon: Redo2, label: 'Redo', shortcut: '⌘⇧Z' },
  { id: 'sep5' },
  { id: 'zoom-in', icon: ZoomIn, label: 'Zoom in', shortcut: '+' },
  { id: 'zoom-out', icon: ZoomOut, label: 'Zoom out', shortcut: '-' },
  { id: 'fit', icon: Maximize2, label: 'Fit screen', shortcut: '⌘0' },
];

const VIEW_TOOLS = [
  { id: TOOL.POINTER, icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: TOOL.HAND, icon: Hand, label: 'Pan', shortcut: 'H' },
  { id: 'sep1' },
  { id: TOOL.COMMENT, icon: MessageCircle, label: 'Comment', shortcut: 'C' },
  { id: 'sep2' },
  { id: 'zoom-in', icon: ZoomIn, label: 'Zoom in', shortcut: '+' },
  { id: 'zoom-out', icon: ZoomOut, label: 'Zoom out', shortcut: '-' },
  { id: 'fit', icon: Maximize2, label: 'Fit screen', shortcut: '⌘0' },
];

export default function FloatingToolbar({
  activeTool,
  onToolChange,
  isEditMode,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFit,
  canUndo,
  canRedo,
}) {
  const tools = isEditMode ? EDIT_TOOLS : VIEW_TOOLS;

  const handleClick = (id) => {
    if (id === 'undo') return onUndo();
    if (id === 'redo') return onRedo();
    if (id === 'zoom-in') return onZoomIn();
    if (id === 'zoom-out') return onZoomOut();
    if (id === 'fit') return onFit();
    if (id.startsWith('sep')) return;
    onToolChange(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-0.5 p-1.5 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/60 shadow-card"
    >
      {tools.map((t) => {
        if (t.id.startsWith('sep')) {
          return <div key={t.id} className="h-px bg-line/80 mx-1 my-0.5" />;
        }
        const Icon = t.icon;
        const active = activeTool === t.id;
        const disabled = (t.id === 'undo' && !canUndo) || (t.id === 'redo' && !canRedo);
        return (
          <button
            key={t.id}
            type="button"
            title={`${t.label} (${t.shortcut})`}
            disabled={disabled}
            onClick={() => handleClick(t.id)}
            className={`group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              active
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-muted hover:bg-brand-light hover:text-brand'
            } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
          >
            <Icon className="w-[17px] h-[17px]" strokeWidth={active ? 2.25 : 2} />
          </button>
        );
      })}
    </motion.div>
  );
}
