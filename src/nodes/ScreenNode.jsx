import { memo } from 'react';
import InlineEdit from '../canvas/InlineEdit';
import { NodeFrame, useNodeActions } from './BaseNode';

export const ScreenNode = memo(function ScreenNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  return (
    <NodeFrame id={id} selected={selected} locked={data.locked} className="rounded-xl w-[260px]" minW={200} minH={120}>
      {isEdit && selected && (
        <div className="px-3 py-2 border-b border-[#E8E6DF] bg-[#F9FAFB] rounded-t-xl">
          <InlineEdit value={data.subtitle || ''} onChange={(v) => updateNode(id, { subtitle: v })} enabled={isEdit} className="text-[10px] text-[#6B7280]" placeholder="Page link (optional)" />
        </div>
      )}
      <div className="p-4">
        <InlineEdit value={data.title} onChange={(v) => updateNode(id, { title: v })} enabled={isEdit} className="text-sm font-semibold text-[#1B1D28] block" placeholder="Screen or page name" />
        {isEdit && selected && (
          <InlineEdit value={data.description} onChange={(v) => updateNode(id, { description: v })} enabled={isEdit} multiline className="text-[11px] text-[#6B7280] mt-1 block" placeholder="What happens here (optional)" />
        )}
      </div>
    </NodeFrame>
  );
});
