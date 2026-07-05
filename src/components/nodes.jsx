import {
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  MarkerType,
} from '@xyflow/react';
import { motion } from 'framer-motion';
import { GitBranch, Zap } from 'lucide-react';
import { brand, flowColors } from '../lib/theme';
import { participants } from '../data/journeys';
import { ActorMini } from './ActorBadge';

const colorBar = {
  sky: 'bg-sky',
  brand: 'bg-brand',
  slate: 'bg-slate',
  amber: 'bg-amber',
  teal: 'bg-teal',
};

export function StepNode({ data, selected }) {
  const from = participants[data.from];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border bg-white overflow-hidden cursor-pointer transition-shadow ${
        selected ? 'border-brand shadow-glow ring-2 ring-brand/20' : 'border-line shadow-sm hover:shadow-card hover:border-brand/30'
      } ${data.dashed ? 'border-dashed' : ''}`}
      style={{ width: 228 }}
    >
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-brand !border !border-white" />
      <div className={`h-0.5 ${colorBar[from.color]}`} />
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[9px] font-bold text-brand tabular-nums">Step {data.stepNum}</span>
          {data.dashed && <Zap className="w-3 h-3 text-slate shrink-0" title="Happens automatically" />}
        </div>
        <div className="mb-1.5">
          <ActorMini fromId={data.from} toId={data.to} />
        </div>
        <p className="text-[11px] leading-snug text-ink line-clamp-3">{data.text}</p>
      </div>
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-brand !border !border-white" />
    </motion.div>
  );
}

export function NoteNode({ data, selected }) {
  const isSide = !!data.anchor;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border px-3 py-2.5 cursor-pointer transition-shadow ${
        selected ? 'shadow-glow ring-2 ring-brand/20' : 'shadow-sm hover:shadow-card'
      } ${
        isSide
          ? 'bg-brand-light/80 border-brand/20 text-navy'
          : 'bg-ink border-ink text-white'
      }`}
      style={{ width: 228 }}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <p className={`text-[11px] leading-snug line-clamp-3 ${isSide ? '' : 'font-display font-semibold text-center'}`}>
        {data.text.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < data.text.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </motion.div>
  );
}

export function ForkNode({ selected }) {
  return (
    <div className="flex items-center justify-center w-[72px] h-[72px]">
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-brand !border !border-white" />
      <div
        className={`w-9 h-9 rotate-45 rounded-lg border-2 flex items-center justify-center transition-shadow ${
          selected
            ? 'bg-brand border-brand text-white shadow-glow'
            : 'bg-brand-light border-brand text-brand'
        }`}
        title="Different outcomes based on what happens"
      >
        <GitBranch className="w-3.5 h-3.5 -rotate-45" />
      </div>
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-brand !border !border-white" />
    </div>
  );
}

export function JourneyEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const isBranch = data?.branch;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: isBranch ? brand.DEFAULT : flowColors.edge,
          strokeWidth: isBranch ? 2 : 1.5,
          strokeDasharray: isBranch ? '5 4' : undefined,
        }}
        markerEnd={{
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: isBranch ? brand.DEFAULT : flowColors.edge,
        }}
      />
      {data?.label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="px-2 py-0.5 rounded-full bg-white border border-brand/20 text-[9px] font-semibold text-navy shadow-sm max-w-[160px] text-center leading-tight line-clamp-2"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const nodeTypes = { step: StepNode, note: NoteNode, fork: ForkNode };
export const edgeTypes = { journey: JourneyEdge };
