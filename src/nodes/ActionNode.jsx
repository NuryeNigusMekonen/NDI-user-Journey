import { memo } from 'react';
import InlineEdit from '../canvas/InlineEdit';
import { NodeFrame, useNodeActions } from './BaseNode';
import ConnectionPorts from './ConnectionPorts';
import { flowClassStyles, customFlowStyles, FLOW_CLASSES } from '../lib/flowVariants';

export const ActionNode = memo(function ActionNode({ id, data, selected }) {
  const { isEdit, updateNode } = useNodeActions();
  const flowClass = data.flowClass;
  const customStyle = data.customStyle;
  const isFlowchart = flowClass || customStyle || data.flowchart;
  const palette = flowClass ? FLOW_CLASSES[flowClass] : null;
  const variantStyle = customStyle
    ? customFlowStyles(customStyle, { selected })
    : flowClassStyles(flowClass, { selected });
  const textColor = customStyle?.text || palette?.text || '#1B1D28';

  if (!isFlowchart) {
    return (
      <NodeFrame
        id={id}
        selected={selected}
        locked={data.locked}
        resizable
        handles={false}
        className="rounded-lg w-full h-full"
        minW={160}
        minH={72}
      >
        <ConnectionPorts />
        <div className="p-3 border-l-[3px] border-l-brand/70">
          <InlineEdit
            value={data.title}
            onChange={(v) => updateNode(id, { title: v })}
            enabled={isEdit}
            className="text-xs font-semibold text-[#1B1D28] block"
            placeholder="Describe what happens…"
          />
          {(data.description || (isEdit && selected)) && (
            <InlineEdit
              value={data.description}
              onChange={(v) => updateNode(id, { description: v })}
              enabled={isEdit}
              multiline
              className="text-[10px] text-[#6B7280] mt-1.5 block leading-snug"
              placeholder="More detail (optional)"
            />
          )}
        </div>
      </NodeFrame>
    );
  }

  return (
    <NodeFrame
      id={id}
      selected={selected}
      locked={data.locked}
      resizable
      handles={false}
      className="rounded-sm dg-flowchart-node border-2 w-full h-full min-h-full box-border"
      style={variantStyle}
      minW={120}
      minH={44}
    >
      <ConnectionPorts />
      <div className="px-3 py-2.5 text-center w-full h-full min-h-0 flex flex-col items-center justify-center overflow-hidden">
        <InlineEdit
          value={data.title}
          onChange={(v) => updateNode(id, { title: v })}
          enabled={isEdit}
          className="text-[13px] font-semibold block leading-snug w-full"
          style={{ color: textColor }}
          placeholder="Title"
        />
        {(data.description || (isEdit && selected)) && (
          <InlineEdit
            value={data.description}
            onChange={(v) => updateNode(id, { description: v })}
            enabled={isEdit}
            multiline
            className="text-[11px] mt-1 block leading-snug w-full whitespace-pre-wrap"
            style={{ color: textColor, opacity: 0.92 }}
            placeholder="Subtitle"
          />
        )}
      </div>
    </NodeFrame>
  );
});
