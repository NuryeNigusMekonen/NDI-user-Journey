import { motion } from 'framer-motion';
import {
  User, Play, Square, Monitor, Zap, GitBranch, StickyNote, Type,
} from 'lucide-react';
import { JOURNEY_PALETTE, MAP_PALETTE, LABEL_PALETTE } from '../types/diagram';

const ICONS = {
  User, Play, Square, Monitor, Zap, GitBranch, StickyNote, Type,
};

export default function Palette({ isEdit, draggingType, onDragStart, onDragEnd }) {
  if (!isEdit) return null;

  const renderSection = (title, items) => (
    <div className="mb-3">
      <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <div
              key={`${title}-${item.type}`}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              onDragEnd={onDragEnd}
              title={item.hint}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
                draggingType === item.type ? 'bg-blue-50 border border-blue-200' : 'hover:bg-[#F3F4F6] border border-transparent'
              }`}
            >
              <span className="w-7 h-7 rounded-md bg-white border border-[#E8E6DF] flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
              </span>
              <div className="min-w-0">
                <span className="text-xs font-medium text-[#374151] block">{item.label}</span>
                {item.hint && (
                  <span className="text-[9px] text-[#9CA3AF] block leading-tight">{item.hint}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <motion.aside
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-3 top-4 bottom-4 w-48 z-20 flex flex-col rounded-xl bg-white/90 backdrop-blur border border-[#E8E6DF] shadow-sm overflow-hidden"
    >
      <div className="px-3 py-2.5 border-b border-[#E8E6DF]">
        <p className="text-xs font-semibold text-[#374151]">Add shapes</p>
        <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-snug">Drag onto the map</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {renderSection('Member journey', MAP_PALETTE)}
        {renderSection('Flowchart', JOURNEY_PALETTE)}
        {renderSection('Notes & labels', LABEL_PALETTE)}
      </div>
    </motion.aside>
  );
}
