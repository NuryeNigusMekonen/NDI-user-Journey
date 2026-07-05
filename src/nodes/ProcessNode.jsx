import { memo } from 'react';
import SchemaFields from './SchemaFields';
import { NodeFrame, useNodeActions } from './BaseNode';

export const ProcessNode = memo(function ProcessNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  return (
    <NodeFrame id={id} selected={selected} locked={data.locked} className="rounded-md w-[200px]" minW={140} minH={56}>
      <div className="p-3">
        <SchemaFields nodeType="process" data={data} isEdit={isEdit} selected={selected} onChange={(p) => updateNode(id, p)} />
      </div>
    </NodeFrame>
  );
});
