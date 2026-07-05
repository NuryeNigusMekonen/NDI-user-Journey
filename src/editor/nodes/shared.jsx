import { Handle, Position, NodeResizer } from '@xyflow/react';
import { motion } from 'framer-motion';
import { useEditorSafe } from '../context/EditorContext';
import { DEFAULT_NODE_STYLE } from '../constants';

export function useNodeEdit() {
  const editor = useEditorSafe();
  return {
    isEditMode: editor?.isEditMode ?? false,
    updateNode: editor?.updateNodeData ?? (() => {}),
    locked: false,
  };
}

export function resolveStyle(data) {
  const s = { ...DEFAULT_NODE_STYLE, ...(data?.style || {}) };
  return {
    backgroundColor: s.backgroundColor,
    borderColor: s.borderColor,
    borderWidth: s.borderWidth ?? 1,
    opacity: s.locked ? 0.85 : (s.opacity ?? 1),
    fontSize: s.fontSize || 13,
    fontWeight: s.fontWeight || 500,
    padding: s.padding || 12,
    boxShadow: s.shadow !== false
      ? '0 1px 2px rgba(27,29,40,.06), 0 8px 24px rgba(27,29,40,.08)'
      : 'none',
    zIndex: s.zIndex ?? 0,
  };
}

export function NodeShell({
  id, data, selected, children, className = '', style = {}, width, minWidth, minHeight,
  resizable = true, handles = true,
}) {
  const { isEditMode } = useNodeEdit();
  const st = resolveStyle(data);
  const locked = data?.style?.locked;

  return (
    <>
      {isEditMode && resizable && !locked && (
        <NodeResizer minWidth={minWidth || 120} minHeight={minHeight || 60} isVisible={selected} />
      )}
      {handles && (
        <>
          <Handle type="target" position={Position.Top} id="top" className="ux-handle" />
          <Handle type="target" position={Position.Left} id="left" className="ux-handle" />
          <Handle type="source" position={Position.Right} id="right" className="ux-handle" />
          <Handle type="source" position={Position.Bottom} id="bottom" className="ux-handle" />
        </>
      )}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: st.opacity, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className={`relative transition-all duration-200 ${locked ? 'cursor-not-allowed' : ''} ${
          selected
            ? 'ring-2 ring-brand/35 shadow-glow'
            : 'hover:shadow-card hover:-translate-y-px'
        } ${className}`}
        style={{
          width,
          minWidth,
          backgroundColor: st.backgroundColor,
          borderColor: st.borderColor,
          borderWidth: st.borderWidth,
          borderStyle: 'solid',
          fontSize: st.fontSize,
          fontWeight: st.fontWeight,
          boxShadow: st.boxShadow,
          zIndex: st.zIndex,
          ...style,
        }}
        data-node-id={id}
      >
        {children}
      </motion.div>
    </>
  );
}
