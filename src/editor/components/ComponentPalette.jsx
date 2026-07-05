import { motion } from 'framer-motion';
import {
  User, Play, Square, Monitor, Workflow, GitBranch,
  ArrowLeftRight, StickyNote, Layers,
} from 'lucide-react';
import { PALETTE_ITEMS } from '../constants';

const ICONS = {
  User, Play, Square, Monitor, Workflow, GitBranch,
  ArrowLeftRight, StickyNote, Layers,
};

export default function ComponentPalette({ isEditMode, draggingType, onDragStart, onDragEnd }) {
  if (!isEditMode) return null;

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute left-16 top-4 bottom-4 w-48 z-20 flex flex-col rounded-2xl bg-white/85 backdrop-blur-xl border border-line/80 shadow-card overflow-hidden"
      >
        <div className="px-3 py-3 border-b border-line/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Journey Elements</p>
          <p className="text-[10px] text-ink-muted/70 mt-0.5">Drag onto canvas</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {PALETTE_ITEMS.map((item) => {
            const Icon = ICONS[item.icon];
            const active = draggingType === item.type;
            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                onDragEnd={onDragEnd}
                className={`flex items-start gap-2.5 px-2.5 py-2 rounded-xl border cursor-grab active:cursor-grabbing transition-all group ${
                  active
                    ? 'border-brand/40 bg-brand-light/50 scale-[0.98]'
                    : 'border-transparent hover:border-brand/20 hover:bg-brand-light/40'
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-cream border border-line flex items-center justify-center group-hover:border-brand/20 transition-colors shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-ink-muted group-hover:text-brand" />
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-ink block">{item.label}</span>
                  <span className="text-[9px] text-ink-muted/70 leading-snug block">{item.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.aside>

      {draggingType && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.6, scale: 1 }}
          className="fixed top-4 right-4 z-50 px-3 py-2 rounded-xl bg-brand text-white text-xs font-semibold shadow-card pointer-events-none"
        >
          Drop to place {PALETTE_ITEMS.find((p) => p.type === draggingType)?.label}
        </motion.div>
      )}
    </>
  );
}
