import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { buildGraph } from '../lib/buildGraph';
import { layoutWithElk } from '../lib/elkLayout';
import { nodeTypes, edgeTypes } from './nodes';
import { ActorLegend } from './ActorBadge';
import NodeDetailPanel from './NodeDetailPanel';
import { brand, actorColors, flowColors } from '../lib/theme';
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

  const minimapNodeColor = useCallback((n) => {
    if (n.type === 'fork') return brand.DEFAULT;
    if (n.type === 'note') return flowColors.note;
    const c = participants[n.data?.from]?.color;
    return actorColors[c] || flowColors.note;
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
        <Background gap={24} size={1} color="#E8E6DF" />
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
