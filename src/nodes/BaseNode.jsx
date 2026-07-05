import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import { useDiagramStore } from '../store/diagramStore';
import { WORKSPACE_MODE } from '../types/diagram';
import ConnectionPorts from './ConnectionPorts';

export const SELECT_RING = 'ring-2 ring-blue-500/50';
export const HOVER_RING = 'hover:ring-1 hover:ring-blue-400/30';

export function useNodeActions() {
  const workspaceMode = useDiagramStore((s) => s.workspaceMode);
  const patch = useDiagramStore((s) => s.patch);
  const nodes = useDiagramStore((s) => s.nodes);
  const isEdit = workspaceMode === WORKSPACE_MODE.EDIT;

  const updateNode = (id, dataPatch) => {
    patch({
      nodes: nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...dataPatch } } : n),
    });
  };

  return { isEdit, updateNode };
}

export const NodeFrame = memo(function NodeFrame({
  id, selected, locked, resizable = false, handles = true, className = '', style = {}, children, minW = 120, minH = 48, maxW, maxH,
}) {
  const { isEdit } = useNodeActions();

  return (
    <>
      {isEdit && resizable && !locked && (
        <NodeResizer
          minWidth={minW}
          minHeight={minH}
          maxWidth={maxW}
          maxHeight={maxH}
          isVisible={selected}
          keepAspectRatio={false}
          lineClassName="!border-brand/50"
          handleClassName="!w-2.5 !h-2.5 !bg-brand !border-2 !border-white !rounded-sm"
        />
      )}
      {handles && <ConnectionPorts />}
      <div
        className={`transition-all duration-150 border ${
          style.backgroundColor ? '' : 'bg-white'
        } ${HOVER_RING} ${
          selected ? SELECT_RING : 'border-[#E8E6DF]'
        } ${locked ? 'opacity-80 cursor-not-allowed' : ''} ${className}`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)', ...style }}
        data-node-id={id}
      >
        {children}
      </div>
    </>
  );
});
