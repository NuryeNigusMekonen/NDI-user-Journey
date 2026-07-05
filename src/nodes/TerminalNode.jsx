import { memo } from 'react';
import InlineEdit from '../canvas/InlineEdit';
import { NodeFrame, useNodeActions } from './BaseNode';

export const TerminalNode = memo(function TerminalNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  const isStart = data.variant !== 'end';

  return (
    <NodeFrame id={id} selected={selected} locked={data.locked} resizable={false} handles className="rounded-full px-5 py-2" minW={90} minH={40}>
      <div
        className={`text-xs font-semibold text-center ${isStart ? 'text-white' : 'text-white'}`}
        style={{ backgroundColor: isStart ? '#22C55E' : '#EF4444', borderRadius: 999, padding: '8px 16px', margin: -1 }}
      >
        <InlineEdit
          value={data.title}
          onChange={(v) => updateNode(id, { title: v })}
          enabled={isEdit}
          className="text-white"
          placeholder={isStart ? 'Where it begins' : 'Where it ends'}
        />
      </div>
    </NodeFrame>
  );
});
