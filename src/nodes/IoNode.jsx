import { memo } from 'react';
import InlineEdit from '../canvas/InlineEdit';
import { NodeFrame, useNodeActions } from './BaseNode';

export const IoNode = memo(function IoNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  return (
    <NodeFrame id={id} selected={selected} locked={data.locked} resizable={false} className="border-0 bg-transparent shadow-none" minW={160} minH={64}>
      <div className="relative w-[180px] h-[64px] flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-[#D1D5DB] bg-white" style={{ transform: 'skewX(-12deg)', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }} />
        <div className="relative z-10 px-3 text-center">
          <InlineEdit value={data.title} onChange={(v) => updateNode(id, { title: v })} enabled={isEdit} className="text-xs font-semibold text-[#1B1D28]" placeholder="What goes in or out" />
          {isEdit && selected && (
            <InlineEdit value={data.description || ''} onChange={(v) => updateNode(id, { description: v })} enabled={isEdit} multiline className="text-[10px] text-[#6B7280] mt-1 block" placeholder="More detail (optional)" />
          )}
        </div>
      </div>
    </NodeFrame>
  );
});
