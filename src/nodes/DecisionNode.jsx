import { memo } from 'react';
import InlineEdit from '../canvas/InlineEdit';
import { NodeFrame, useNodeActions } from './BaseNode';
import DecisionPorts from './DecisionPorts';
import { flowClassStyles, customFlowStyles, FLOW_CLASSES } from '../lib/flowVariants';

export const DecisionNode = memo(function DecisionNode({ id, data, selected, width, height }) {
  const { isEdit, updateNode } = useNodeActions();
  const flowClass = data.flowClass;
  const customStyle = data.customStyle;
  const isFlowchart = flowClass || customStyle || data.flowchart;
  const palette = flowClass ? FLOW_CLASSES[flowClass] : null;
  const variantStyle = customStyle
    ? customFlowStyles(customStyle, { selected })
    : flowClassStyles(flowClass, { selected });
  const fill = customStyle?.fill || palette?.fill || '#fff';
  const stroke = customStyle?.stroke || palette?.stroke || '#1F4E79';
  const textColor = customStyle?.text || palette?.text || '#1B1D28';

  const boxW = width || 120;
  const boxH = height || 120;
  const inner = Math.min(boxW, boxH);
  const diamond = Math.max(Math.min(inner * 0.88, 160), 72);

  return (
    <NodeFrame
      id={id}
      selected={selected}
      locked={data.locked}
      resizable={false}
      handles={false}
      className="border-0 bg-transparent shadow-none w-full h-full"
      minW={100}
      minH={100}
    >
      <div className={`flex flex-col items-center justify-center w-full h-full ${isFlowchart ? 'dg-flowchart-node' : ''}`}>
        <div
          className="relative flex items-center justify-center w-full h-full"
          style={{ minWidth: diamond, minHeight: diamond }}
        >
          <DecisionPorts muted={!!isFlowchart} />
          <div
            className={`absolute rotate-45 border-2 ${isFlowchart ? 'rounded-[2px]' : 'rounded-sm'} ${
              !isFlowchart && (selected ? 'border-brand bg-brand/5' : 'border-brand/60 bg-white')
            }`}
            style={isFlowchart ? {
              width: diamond,
              height: diamond,
              backgroundColor: fill,
              borderColor: stroke,
              boxShadow: variantStyle?.boxShadow || `0 1px 3px ${stroke}22`,
            } : {
              width: diamond,
              height: diamond,
              inset: 0,
              margin: 'auto',
              boxShadow: '0 2px 6px rgba(31,78,121,0.12)',
            }}
          />
          <div className="relative z-10 text-center px-1" style={{ maxWidth: diamond * 0.72 }}>
            {!isFlowchart && (
              <span className="text-[8px] font-bold text-brand block mb-0.5">If</span>
            )}
            <InlineEdit
              value={data.title}
              onChange={(v) => updateNode(id, { title: v })}
              enabled={isEdit}
              className="text-[11px] font-semibold leading-tight"
              style={{ color: textColor }}
              placeholder="Question?"
            />
            {isFlowchart && data.description && (
              <InlineEdit
                value={data.description}
                onChange={(v) => updateNode(id, { description: v })}
                enabled={isEdit}
                multiline
                className="text-[9px] mt-0.5 leading-tight block whitespace-pre-wrap"
                style={{ color: textColor, opacity: 0.92 }}
                placeholder=""
              />
            )}
          </div>
        </div>
        {isEdit && selected && !isFlowchart && (
          <div className="mt-1 w-[160px] text-center px-2">
            <InlineEdit
              value={data.description}
              onChange={(v) => updateNode(id, { description: v })}
              enabled={isEdit}
              multiline
              className="text-[9px] text-[#6B7280] leading-snug block"
              placeholder="When does each path happen? (optional)"
            />
          </div>
        )}
      </div>
    </NodeFrame>
  );
});
