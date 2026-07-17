import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  MarkerType,
} from '@xyflow/react';
import { useEditorSafe } from '../context/EditorContext';
import { brand, flowColors } from '../../lib/theme';

function EdgeLabel({ id, labelX, labelY, label, selected }) {
  const editor = useEditorSafe();
  const isEditMode = editor?.isEditMode ?? false;
  const updateEdgeData = editor?.updateEdgeData;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label || '');

  if (!isEditMode && !label) return null;

  const commit = () => {
    updateEdgeData?.(id, { label: draft });
    setEditing(false);
  };

  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          pointerEvents: 'all',
        }}
        className="nodrag nopan"
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
              e.stopPropagation();
            }}
            className="px-2 py-0.5 rounded-full bg-white border border-brand text-[9px] font-semibold text-ink shadow-sm w-24 text-center outline-none"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={() => { if (isEditMode) setEditing(true); }}
            className={`px-2.5 py-1 rounded-full border text-[9px] font-semibold shadow-sm transition-all max-w-[160px] truncate ${
              selected
                ? 'bg-brand text-white border-brand'
                : 'bg-white border-line text-ink hover:border-brand/40'
            }`}
          >
            {label || (isEditMode ? 'Add label' : '')}
          </button>
        )}
      </div>
    </EdgeLabelRenderer>
  );
}

export function UxmEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  data, selected, markerEnd,
}) {
  const editor = useEditorSafe();
  const isEditMode = editor?.isEditMode ?? false;
  const isBranch = data?.branch;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.35,
  });

  const stroke = isBranch ? brand.DEFAULT : (data?.color || flowColors.edge);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke,
          strokeWidth: selected ? 2.5 : isBranch ? 2 : 1.75,
          strokeDasharray: isBranch ? '6 4' : undefined,
          transition: 'stroke-width 0.15s, stroke 0.15s',
          filter: selected ? 'drop-shadow(0 0 4px rgba(37,99,174,.3))' : undefined,
        }}
        markerEnd={markerEnd || {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: stroke,
        }}
        interactionWidth={20}
      />
      {(data?.label || isEditMode) && (
        <EdgeLabel
          id={id}
          labelX={labelX}
          labelY={labelY}
          label={data?.label}
          selected={selected}
        />
      )}
    </>
  );
}

export const editorEdgeTypes = {
  journey: UxmEdge,
  uxm: UxmEdge,
};
