import { memo } from 'react';
import InlineEdit from '../canvas/InlineEdit';
import { NodeFrame, useNodeActions } from './BaseNode';

export const EntityNode = memo(function EntityNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  const fields = data.fields || ['id'];

  return (
    <NodeFrame id={id} selected={selected} locked={data.locked} className="rounded-md w-[200px] overflow-hidden" minW={160} minH={80}>
      <div className="px-3 py-2 bg-[#F3F4F6] border-b border-[#E8E6DF] font-semibold text-xs text-[#1B1D28]">
        <InlineEdit value={data.title} onChange={(v) => updateNode(id, { title: v })} enabled={isEdit} placeholder="Entity" />
      </div>
      <div className="divide-y divide-[#E8E6DF] px-3 py-2">
        <InlineEdit
          value={(fields || []).join(', ')}
          onChange={(v) => updateNode(id, { fields: v.split(',').map((s) => s.trim()).filter(Boolean) })}
          enabled={isEdit}
          className="text-[11px] text-[#4B5563] font-mono block w-full"
          placeholder="id, name, email"
        />
      </div>
    </NodeFrame>
  );
});
