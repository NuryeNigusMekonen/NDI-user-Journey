import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import InlineEdit from '../canvas/InlineEdit';
import { useNodeActions, SELECT_RING } from './BaseNode';

export const TextNode = memo(function TextNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  const fontSize = data.fontSize || 15;
  const fontWeight = data.fontWeight || 500;
  const color = data.color || '#1B1D28';
  const align = data.align || 'left';

  return (
    <>
      {isEdit && !data.locked && (
        <NodeResizer
          minWidth={48}
          minHeight={22}
          isVisible={selected}
          lineClassName="!border-blue-400"
          handleClassName="!w-2 !h-2 !bg-blue-500 !border-white"
        />
      )}
      <div
        className={`min-w-[60px] px-1 py-0.5 transition-shadow ${selected ? `${SELECT_RING} rounded` : ''}`}
        style={{
          fontSize,
          fontWeight,
          color,
          textAlign: align,
          width: '100%',
          height: '100%',
          zIndex: 6,
        }}
      >
        <InlineEdit
          value={data.text}
          onChange={(v) => updateNode(id, { text: v, justCreated: false })}
          enabled={isEdit}
          multiline
          autoEdit={data.justCreated}
          className="block leading-snug whitespace-pre-wrap break-words"
          placeholder="Add text…"
        />
      </div>
    </>
  );
});
