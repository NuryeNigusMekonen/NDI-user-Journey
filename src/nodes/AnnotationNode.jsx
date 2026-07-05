import { memo } from 'react';
import InlineEdit from '../canvas/InlineEdit';
import { NodeFrame, useNodeActions } from './BaseNode';

export const AnnotationNode = memo(function AnnotationNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  return (
    <NodeFrame id={id} selected={selected} locked={data.locked} handles={false} className="rounded-md border-[#FDE68A] w-[160px]" minW={120} minH={90} style={{ backgroundColor: data.color || '#FEF9C3', zIndex: 5 }}>
      <div className="p-2.5">
        <InlineEdit value={data.text} onChange={(v) => updateNode(id, { text: v })} enabled={isEdit} multiline className="text-[11px] text-[#1B1D28] leading-snug block" placeholder="Write a note…" />
      </div>
    </NodeFrame>
  );
});
