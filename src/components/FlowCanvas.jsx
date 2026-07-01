import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { buildGraph } from '../lib/buildGraph';
import { layoutWithElk } from '../lib/elkLayout';
import { nodeTypes, edgeTypes } from './nodes';
import { ActorLegend } from './ActorBadge';
import MapControls from './MapControls';
import NodeDetailPanel from './NodeDetailPanel';
import { participants } from '../data/journeys';

function focusOnFirstStep(nodes, setCenter, fitView) {
  const firstStep =
    nodes.find((n) => n.type === 'step' && n.data?.stepNum === 1) ||
    [...nodes].filter((n) => n.type === 'step').sort((a, b) => a.data.stepNum - b.data.stepNum)[0] ||
    null;

  if (!firstStep?.position) {
    fitView({ padding: 0.2, duration: 500 });
    return firstStep;
  }

  const w = firstStep.width ?? 228;
  const h = firstStep.height ?? 88;
  const x = firstStep.position.x + w / 2;
  const y = firstStep.position.y + h / 2;

  setCenter(x, y, { zoom: 1.2, duration: 550 });
  return firstStep;
}

function FlowInner({ journey, journeyIndex }) {
  const { setCenter, fitView } = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [laidNodes, setLaidNodes] = useState([]);

  useEffect(() => {
    setSelected(null);
  }, [journeyIndex]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const graph = buildGraph(journey.items);
      const laid = await layoutWithElk(graph.nodes, graph.edges);
      if (cancelled) return;
      const nextNodes = laid.nodes.map((n) => ({ ...n, type: n.type, data: n.data }));
      setLaidNodes(nextNodes);
      setNodes(nextNodes);
      setEdges(
        laid.edges.map((e) => ({
          ...e,
          type: 'journey',
          animated: e.data?.branch,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: e.data?.branch ? '#5658A6' : '#C8C5D6',
            width: 16,
            height: 16,
          },
        })),
      );
      setLoading(false);
      setTimeout(() => {
        if (!cancelled) focusOnFirstStep(nextNodes, setCenter, fitView);
      }, 120);
    })();
    return () => {
      cancelled = true;
    };
  }, [journey, journeyIndex, setCenter, fitView]);

  const onNodeClick = useCallback((_, node) => {
    setSelected(node);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
  }, []);

  const onPaneClick = useCallback(() => {
    setSelected(null);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
  }, []);

  const focusStart = useCallback(() => {
    focusOnFirstStep(laidNodes, setCenter, fitView);
  }, [laidNodes, setCenter, fitView]);

  const minimapNodeColor = useCallback((n) => {
    if (n.type === 'fork') return '#5658A6';
    if (n.type === 'note') return '#213871';
    const c = participants[n.data?.from]?.color;
    return { sky: '#0E7FBF', brand: '#5658A6', slate: '#5B6472', amber: '#B5730A', teal: '#0D7A6E' }[c] || '#213871';
  }, []);

  return (
    <div className="w-full h-full relative bg-[#FAFAF8]">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-cream/80 backdrop-blur-sm">
          <div className="text-sm font-medium text-ink-muted animate-pulse">Building journey map…</div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.2}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        panOnScroll
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <defs>
          <marker id="arrow-main" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#C8C5D6" />
          </marker>
          <marker id="arrow-branch" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#5658A6" />
          </marker>
        </defs>
        <Background gap={24} size={1} color="#E8E6DF" />
        <MapControls onFocusStart={focusStart} />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(250,250,248,.85)"
          className="!rounded-xl !border !border-line !shadow-card !mb-4 !mr-4"
          style={{ width: 130, height: 88 }}
          position="bottom-right"
        />
        <Panel position="top-right" className="!m-4 !mt-3 max-w-[min(100%,420px)]">
          <div className="bg-white/95 border border-line rounded-xl shadow-card px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-2 px-0.5">Legend</p>
            <ActorLegend compact />
          </div>
        </Panel>
        <Panel position="bottom-center" className="!mb-4 pointer-events-none">
          <p className="text-[10px] text-ink-muted bg-white/95 border border-line rounded-full px-3 py-1.5 shadow-sm">
            Click any step for details · scroll to zoom · drag to explore
          </p>
        </Panel>
      </ReactFlow>

      <NodeDetailPanel node={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function FlowCanvas({ journey, journeyIndex }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={journeyIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full h-full"
      >
        <ReactFlowProvider>
          <FlowInner journey={journey} journeyIndex={journeyIndex} />
        </ReactFlowProvider>
      </motion.div>
    </AnimatePresence>
  );
}
