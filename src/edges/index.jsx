import { memo, useEffect, useState } from 'react';
import {
  BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, MarkerType,
} from '@xyflow/react';
import { useDiagramStore } from '../store/diagramStore';
import { WORKSPACE_MODE, EDGE_FLOW } from '../types/diagram';
import { BRANCH_COLORS } from '../services/FlowInference';

const MARKER = { type: MarkerType.ArrowClosed, width: 16, height: 16 };

function normalizeFlow(flowType) {
  if (!flowType || flowType === 'process') return EDGE_FLOW.DEFAULT;
  return flowType;
}

const FLOW_STYLES = {
  [EDGE_FLOW.DEFAULT]: { stroke: '#8194AE', dash: null, animate: false },
  [EDGE_FLOW.CONDITIONAL]: { stroke: '#2563AE', dash: '8 5', animate: true },
  [EDGE_FLOW.DATA]: { stroke: '#3B7BC9', dash: '9 6', animate: true },
  journey: { stroke: '#8194AE', dash: null, animate: false },
  flowchart: { stroke: '#5F5E5A', dash: null, animate: false },
  flowchartConditional: { stroke: '#5F5E5A', dash: null, animate: false },
  auxiliary: { stroke: '#9CA3AF', dash: '4 4', animate: false },
};

function getPath(type, props, branchIndex = 0) {
  const spread = (branchIndex - 1) * 0.22;
  const args = { ...props, borderRadius: type === 'orthogonal' ? 0 : 14 };
  if (type === 'smoothstep' || type === 'orthogonal' || type === 'journey') {
    return getSmoothStepPath(args);
  }
  return getBezierPath({ ...props, curvature: 0.35 + spread });
}

const EdgeLabel = memo(function EdgeLabel({
  id, labelX, labelY, label, selected, flowType, journeyBranch, systemEdge,
  branchColor, startEditing, flowchart,
}) {
  const workspaceMode = useDiagramStore((s) => s.workspaceMode);
  const edges = useDiagramStore((s) => s.edges);
  const patch = useDiagramStore((s) => s.patch);
  const isEdit = workspaceMode === WORKSPACE_MODE.EDIT;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label || '');

  useEffect(() => {
    setDraft(label || '');
  }, [label]);

  const resolvedFlow = systemEdge ? EDGE_FLOW.DATA : (journeyBranch ? EDGE_FLOW.CONDITIONAL : normalizeFlow(flowType));
  const isConditional = resolvedFlow === EDGE_FLOW.CONDITIONAL || journeyBranch;
  const showUi = isEdit || !!label;

  const commit = (text) => {
    patch({
      edges: edges.map((e) => (e.id === id ? { ...e, data: { ...e.data, label: text.trim() } } : e)),
    });
    setEditing(false);
  };

  const openEdit = (e) => {
    e?.stopPropagation();
    if (!isEdit) return;
    setDraft(label || '');
    setEditing(true);
  };

  useEffect(() => {
    if (startEditing && isEdit && !editing) {
      setDraft(label || '');
      setEditing(true);
    }
  }, [startEditing, isEdit, editing, label]);

  if (!showUi) return null;

  const badgeColor = isConditional
    ? (flowchart ? 'bg-[#F1EFE8] border-[#5F5E5A] text-[#2C2C2A]' : 'bg-red-50 border-red-200 text-red-700')
    : resolvedFlow === EDGE_FLOW.DATA
      ? 'bg-sky-50 border-sky-200 text-sky-700'
      : 'bg-white border-[#D1D5DB] text-[#374151]';

  const borderStyle = branchColor && isConditional ? { borderColor: branchColor, color: branchColor } : {};

  const placeholder = journeyBranch ? 'Name this path' : 'Name (optional)';

  return (
    <EdgeLabelRenderer>
      <div
        style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }}
        className="nodrag nopan"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(draft);
              if (e.key === 'Escape') { setEditing(false); setDraft(label || ''); }
              e.stopPropagation();
            }}
            placeholder={placeholder}
            className="px-2.5 py-1 rounded-md border-2 border-blue-400 text-[10px] outline-none bg-white w-32 text-center shadow-sm"
          />
        ) : label ? (
          <button
            type="button"
            onClick={openEdit}
            title={isEdit ? 'Click to edit label' : label}
            style={borderStyle}
            className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold shadow-sm transition-colors ${
              selected && isEdit ? 'bg-blue-500 text-white border-blue-500' : badgeColor
            } ${isEdit ? 'hover:ring-2 hover:ring-blue-300/50 cursor-text' : 'cursor-default'}`}
          >
            {label}
          </button>
        ) : isEdit ? (
          <button
            type="button"
            onClick={openEdit}
            title="Click to add label"
            style={borderStyle}
            className={`px-2.5 py-1 rounded-full border border-dashed text-[9px] font-medium transition-colors ${
              journeyBranch || isConditional
                ? 'border-brand/50 text-brand bg-brand/5 hover:bg-brand/10'
                : 'border-[#D1D5DB] text-[#6B7280] bg-white/90 hover:bg-blue-50'
            }`}
          >
            + {journeyBranch ? 'name path' : 'add name'}
          </button>
        ) : null}
      </div>
    </EdgeLabelRenderer>
  );
});

export const DiagramEdge = memo(function DiagramEdge(props) {
  const {
    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
    data, selected, type, animated,
  } = props;

  const edgeType = type === 'relationship' ? 'smoothstep' : (type || 'smoothstep');
  const journeyFlow = data?.journeyFlow || type === 'journey';
  const flowType = normalizeFlow(data?.flowType);
  const branchIndex = data?.branchIndex ?? 0;
  const branchColor = data?.branchColor;
  const journeyBranch = data?.journeyBranch;
  const systemEdge = data?.systemEdge;
  const isConditional = journeyBranch || flowType === EDGE_FLOW.CONDITIONAL;

  const baseFlow = data?.auxiliary || data?.edgeStyle === 'dashed' || data?.edgeStyle === 'dotted'
    ? FLOW_STYLES.auxiliary
    : systemEdge
      ? FLOW_STYLES[EDGE_FLOW.DATA]
      : data?.flowchart && isConditional
        ? FLOW_STYLES.flowchartConditional
        : data?.flowchart
          ? FLOW_STYLES.flowchart
          : journeyBranch
            ? FLOW_STYLES[EDGE_FLOW.CONDITIONAL]
            : journeyFlow
              ? FLOW_STYLES.journey
              : (FLOW_STYLES[flowType] || FLOW_STYLES[EDGE_FLOW.DEFAULT]);

  const flow = (isConditional || systemEdge) && branchColor && !data?.flowchart
    ? { ...baseFlow, stroke: branchColor }
    : baseFlow;

  const [path, labelX, labelY] = getPath(edgeType, {
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  }, branchIndex);

  const stroke = data?.highlighted ? '#3B82F6' : flow.stroke;
  const isAnimated = !data?.flowchart && !data?.auxiliary && (animated || data?.animated || flow.animate);

  return (
    <g className="group">
      <BaseEdge
        id={id}
        path={path}
        className={isAnimated ? 'edge-animated' : undefined}
        style={{
          stroke,
          strokeWidth: selected || data?.highlighted ? 2.75 : 2,
          strokeDasharray: flow.dash || undefined,
          transition: 'stroke 0.15s',
        }}
        markerEnd={{ ...MARKER, color: stroke }}
        interactionWidth={24}
      />
      <EdgeLabel
        id={id}
        labelX={labelX}
        labelY={labelY}
        label={data?.label}
        selected={selected}
        flowType={flowType}
        journeyFlow={journeyFlow}
        journeyBranch={journeyBranch}
        systemEdge={systemEdge}
        branchColor={branchColor}
        startEditing={data?.startEditing}
        flowchart={data?.flowchart}
      />
    </g>
  );
});

export const edgeTypes = {
  bezier: DiagramEdge,
  smoothstep: DiagramEdge,
  orthogonal: DiagramEdge,
  relationship: DiagramEdge,
  journey: DiagramEdge,
  uxm: DiagramEdge,
};
