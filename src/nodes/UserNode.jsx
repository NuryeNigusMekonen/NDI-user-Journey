import { memo } from 'react';
import { User } from 'lucide-react';
import InlineEdit from '../canvas/InlineEdit';
import { NodeFrame, useNodeActions } from './BaseNode';

export const UserNode = memo(function UserNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  return (
    <NodeFrame id={id} selected={selected} locked={data.locked} className="rounded-xl w-[190px]" minW={160} minH={90}>
      <div className="flex items-center gap-3 p-3">
        <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-blue-200 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <InlineEdit value={data.name} onChange={(v) => updateNode(id, { name: v })} enabled={isEdit} className="text-sm font-semibold text-[#1B1D28] block" placeholder="Person's name" />
          <InlineEdit value={data.role} onChange={(v) => updateNode(id, { role: v })} enabled={isEdit} className="text-[11px] text-[#6B7280] block" placeholder="Their role" />
          {isEdit && selected && (
            <InlineEdit value={data.description || ''} onChange={(v) => updateNode(id, { description: v })} enabled={isEdit} multiline className="text-[10px] text-[#9CA3AF] mt-1 block leading-snug" placeholder="Notes (optional)" />
          )}
        </div>
      </div>
    </NodeFrame>
  );
});
