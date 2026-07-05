import { NODE_TYPES } from '../types/diagram';
import { FLOW_CLASS_IDS, resolveFlowClass } from './flowVariants';
import { normalizeFlowchartEdgeHandles } from '../services/FlowInference';
import { measureMermaidNode } from './mermaidMeasure';
import { layoutWithDagre, normalizeOrigin } from './mermaidDagreLayout';
import { layoutWithElk } from './elkLayout';
import { countOverlappingNodes, hasBrokenLayout } from './layoutOverlap';

const MERMAID_INIT = {
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'base',
  flowchart: {
    htmlLabels: false,
    curve: 'basis',
    padding: 8,
    nodeSpacing: 50,
    rankSpacing: 70,
    useMaxWidth: false,
  },
  themeVariables: {
    fontFamily: 'DM Sans, system-ui, sans-serif',
    fontSize: '13px',
    primaryColor: '#EEEDFE',
    primaryBorderColor: '#534AB7',
    primaryTextColor: '#26215C',
    lineColor: '#5F5E5A',
  },
};

let mermaidMod = null;
let mermaidReady = false;

async function getMermaid() {
  if (!mermaidMod) {
    mermaidMod = (await import('mermaid')).default;
  }
  if (!mermaidReady) {
    mermaidMod.initialize(MERMAID_INIT);
    mermaidReady = true;
  }
  return mermaidMod;
}

/** Detect native Mermaid flowchart / graph syntax */
export function isMermaidCode(code) {
  const lines = code.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return false;
  const head = lines[0].toLowerCase();
  if (/^(flowchart|graph)\s*(td|tb|bt|lr|rl|[\w-])?$/i.test(head)) return true;
  if (/^(flowchart|graph)\s+(td|tb|bt|lr|rl)/i.test(head)) return true;
  if (lines.some((l) => /^classdef\s/i.test(l)) && lines.some((l) => /-->|---|==>|-\.->/.test(l))) return true;
  return false;
}

/** Extract layout direction from Mermaid header */
export function layoutDirectionFromCode(code) {
  const m = code.trim().match(/^(?:flowchart|graph)\s+(TD|TB|BT|LR|RL|DOWN|UP)/i);
  if (!m) return 'down';
  const d = m[1].toUpperCase();
  if (d === 'LR') return 'right';
  if (d === 'RL') return 'left';
  if (d === 'BT' || d === 'UP') return 'up';
  return 'down';
}

function parseStyleProp(styles, prop) {
  if (!styles?.length) return null;
  const hit = styles.find((s) => s.trim().toLowerCase().startsWith(`${prop}:`));
  return hit ? hit.split(':').slice(1).join(':').trim() : null;
}

function flowClassFromVertex(vertex, classesMap) {
  for (const cls of vertex.classes || []) {
    const resolved = resolveFlowClass(cls);
    if (resolved) return resolved;
  }
  for (const cls of vertex.classes || []) {
    const def = classesMap.get(cls);
    const fill = parseStyleProp(def?.styles, 'fill');
    if (!fill) continue;
    const palette = { neutral: '#F1EFE8', action: '#EEEDFE', success: '#EAF3DE', risk: '#FAECE7' };
    const match = FLOW_CLASS_IDS.find((id) => palette[id]?.toLowerCase() === fill.toLowerCase());
    if (match) return match;
  }
  if (vertex.type === 'diamond' || vertex.type === 'rhombus') return 'neutral';
  return 'action';
}

function customStyleFromVertex(vertex, classesMap) {
  for (const cls of vertex.classes || []) {
    const def = classesMap.get(cls);
    if (!def?.styles?.length) continue;
    const fill = parseStyleProp(def.styles, 'fill');
    const stroke = parseStyleProp(def.styles, 'stroke');
    const color = parseStyleProp(def.textStyles, 'color') || parseStyleProp(def.styles, 'color');
    if (fill) return { fill, stroke: stroke || fill, text: color || '#2C2C2A' };
  }
  return null;
}

function parseMermaidLabel(text) {
  if (!text) return { title: '', description: '', lines: [] };
  const cleaned = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
  const parts = cleaned.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
  const strip = (s) => s.replace(/<[^>]+>/g, '');
  if (parts.length <= 1) {
    const title = strip(cleaned);
    return { title, description: '', lines: title ? [title] : [] };
  }
  const lines = parts.map(strip);
  return {
    title: lines[0],
    description: lines.slice(1).join('\n'),
    lines,
  };
}

function isDecisionShape(vertex) {
  const t = (vertex.type || '').toLowerCase();
  return t === 'diamond' || t === 'rhombus' || t.includes('decision');
}

function buildNodes(db, classesMap) {
  const vertices = db.getVertices?.() || db.vertices;
  const iter = vertices instanceof Map ? vertices.values() : Object.values(vertices);
  const nodes = [];

  for (const vertex of iter) {
    if (!vertex?.id) continue;
    const { title, description } = parseMermaidLabel(vertex.text || vertex.id);
    const flowClass = flowClassFromVertex(vertex, classesMap);
    const customStyle = customStyleFromVertex(vertex, classesMap);
    const isDecision = isDecisionShape(vertex);

    const measured = measureMermaidNode(title, description, isDecision);
    const { width, height } = measured;

    nodes.push({
      id: `mmd-${vertex.id}`,
      type: isDecision ? NODE_TYPES.DECISION : NODE_TYPES.ACTION,
      position: { x: 0, y: 0 },
      width,
      height,
      style: { width, height },
      data: {
        title: title || vertex.id,
        description,
        flowClass: customStyle ? undefined : flowClass,
        customStyle: customStyle || undefined,
        flowchart: true,
        mermaidId: vertex.id,
        locked: false,
      },
    });
  }
  return nodes;
}

function isDashedEdge(raw) {
  return raw.stroke === 'dotted' || raw.stroke === 'dashed'
    || raw.type === 'dotted'
    || raw.style?.some?.((s) => /dash|dot/i.test(s));
}

function buildEdges(db, nodes, edgeStyle) {
  const rawEdges = db.getEdges?.() || db.edges || [];
  const list = Array.isArray(rawEdges) ? rawEdges : [...rawEdges];
  const nodeByMermaidId = new Map(nodes.map((n) => [n.data.mermaidId, n]));

  return list.map((raw, i) => {
    const source = nodeByMermaidId.get(raw.start);
    const target = nodeByMermaidId.get(raw.end);
    if (!source || !target) return null;

    const dashed = isDashedEdge(raw);
    const label = (raw.text || '').trim();

    return {
      id: `mmd-e-${raw.start}-${raw.end}-${i}`,
      source: source.id,
      target: target.id,
      type: edgeStyle,
      animated: false,
      data: {
        label,
        flowchart: true,
        flowType: 'default',
        journeyFlow: false,
        branch: false,
        branchIndex: 0,
        animated: false,
        edgeStyle: dashed ? 'dashed' : null,
        auxiliary: dashed,
        flowMode: 'auto',
      },
    };
  }).filter(Boolean);
}

async function layoutNodes(nodes, edges, layout) {
  const dagre = layoutWithDagre(nodes, edges, layout, {
    nodeSpacing: MERMAID_INIT.flowchart.nodeSpacing,
    rankSpacing: MERMAID_INIT.flowchart.rankSpacing,
  });
  let laid = normalizeOrigin(dagre.nodes);

  const overlaps = countOverlappingNodes(laid);
  if (overlaps > laid.length * 0.15 || hasBrokenLayout(laid)) {
    const elk = await layoutWithElk(nodes, edges, layout, { flowchart: true });
    laid = normalizeOrigin(elk.nodes);
  }

  return laid;
}

/**
 * Import native Mermaid flowchart → React Flow.
 * Layout: Mermaid SVG positions when available, else Dagre (same engine Mermaid uses).
 */
export async function importMermaidToReactFlow(code, edgeStyle = 'smoothstep') {
  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: false, errors: ['Empty Mermaid diagram'] };
  }

  try {
    const mermaid = await getMermaid();
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(trimmed);
    const db = diagram.db;
    const classesMap = db.classes instanceof Map ? db.classes : new Map(Object.entries(db.classes || {}));

    const layout = layoutDirectionFromCode(trimmed);

    let nodes = buildNodes(db, classesMap);
    const edges = buildEdges(db, nodes, edgeStyle);
    nodes = await layoutNodes(nodes, edges, layout);

    const normalizedEdges = normalizeFlowchartEdgeHandles(nodes, edges, layout);

    if (!nodes.length) {
      return { ok: false, errors: ['No nodes found in Mermaid diagram'] };
    }

    return {
      ok: true,
      nodes,
      edges: normalizedEdges,
      warnings: [],
      meta: { layout, mode: 'full', style: 'flowchart', mermaid: true, layoutMethod: 'dagre' },
      mermaidSource: trimmed,
    };
  } catch (err) {
    return {
      ok: false,
      errors: [err.message || 'Failed to parse Mermaid diagram'],
    };
  }
}

/**
 * Re-layout a saved board from its Mermaid source.
 */
export async function relayoutMermaidBoard(mermaidSource, edgeStyle = 'smoothstep', existingNodes = []) {
  if (!mermaidSource?.trim()) return null;
  const result = await importMermaidToReactFlow(mermaidSource, edgeStyle);
  if (!result.ok) return null;

  const byMermaidId = new Map(
    existingNodes.filter((n) => n.data?.mermaidId).map((n) => [n.data.mermaidId, n]),
  );
  const relaidIds = new Set();
  const nodes = result.nodes.map((n) => {
    const prev = byMermaidId.get(n.data.mermaidId);
    if (!prev) return n;
    relaidIds.add(n.data.mermaidId);
    const width = prev.width ?? prev.style?.width ?? n.width;
    const height = prev.height ?? prev.style?.height ?? n.height;
    return {
      ...n,
      id: prev.id,
      position: prev.position ?? n.position,
      ...(width != null ? { width } : {}),
      ...(height != null ? { height } : {}),
      style: {
        ...(n.style || {}),
        ...(prev.style || {}),
        ...(width != null ? { width } : {}),
        ...(height != null ? { height } : {}),
      },
      data: {
        ...n.data,
        title: prev.data?.title ?? n.data.title,
        description: prev.data?.description ?? n.data.description,
      },
    };
  });

  const extras = existingNodes.filter((n) => {
    const mid = n.data?.mermaidId;
    return !mid || !relaidIds.has(mid);
  });

  return { nodes: [...nodes, ...extras], edges: result.edges, mermaidSource: result.mermaidSource };
}

export const JOURNEY1_MERMAID = `flowchart TD
    A[New lead<br/>Form submitted or walk-in]
    B[Send welcome message<br/>Asks goals & hesitations]
    C{Lead responds?}
    D[Send intro offer<br/>+ payment link]
    E[No purchase yet<br/>Pitch sent after class]
    F[Purchase intro offer<br/>Conversion milestone]
    G[Propose class times<br/>Lead picks a slot]
    H[Class booked<br/>Reminder after 2h idle]
    M[Manager briefing<br/>First-timer summary]
    I{Attends class?}
    J[Class locked in<br/>Post-class check-in sent]
    K[No-show recovery<br/>Offers new time]
    L[Rebook or flag<br/>Adjusts cadence]

    A --> B --> C
    C -->|Yes| D --> F
    C -->|No| E --> F
    F --> G --> H
    H -.-> M
    H --> I
    I -->|Yes| J
    I -->|No| K --> L

    classDef neutral fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    classDef action fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef success fill:#EAF3DE,stroke:#3B6D11,color:#173404
    classDef risk fill:#FAECE7,stroke:#993C1D,color:#4A1B0C

    class A,M,C,I neutral
    class B,D,E,G,H action
    class F,J success
    class K,L risk`;
