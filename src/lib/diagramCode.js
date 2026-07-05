import { NODE_TYPES, RF_TYPE_MAP, DEFAULT_NODE_DATA, EDGE_FLOW } from '../types/diagram';
import { participants } from '../data/journeys';
import { inferStepKind, inferJourneyEdgeData, STEP_KIND } from '../types/journeySemantics';
import { resolveFlowClass } from './flowVariants';
import {
  buildEdgeData, inferFlowType, isJourneyNode, isForkNode, isDecisionNode,
  resolveEdgeHandles, normalizeJourneyEdgeHandles, normalizeFlowchartEdgeHandles,
} from '../services/FlowInference';

const JOURNEY_TYPES = new Set([NODE_TYPES.STEP, NODE_TYPES.NOTE, NODE_TYPES.FORK]);
const JOURNEY_NODE_W = 228;
const STEP_H = 88;
const NOTE_H = 64;
const BANNER_H = 52;
const FORK_W = 140;
const FORK_H = 160;
const FLOW_ACTION_W = 240;
const FLOW_ACTION_H = 76;
const FLOW_DECISION = 130;

const META_LINE = /^@(layout|mode|style)\s+(\S+)\s*$/i;
const NODE_LINE = /^(user|start|end|action|process|decision|io|screen|annotation|text|entity|step|note|fork)\s+([a-zA-Z][\w-]*)\s*(.*)$/i;
const EDGE_LINE = /^([a-zA-Z][\w-]*)\s*(?:->|-->|→)\s*([a-zA-Z][\w-]*)(?:\s+(?:"([^"]*)"|'([^']*)'))?(?:\s+when=(?:"([^"]*)"|'([^']*)'|(\S+)))?(?:\s+flow=(auto|default|process|conditional|data|journey))?(?:\s+style=(dashed|dotted|solid))?\s*$/i;
const QUOTED_TITLE = /^"([^"]*)"|^'([^']*)'/;

const EXAMPLE = `# Compass Diagram Code — User Flow + Journey Map
@layout right
@mode overlay

# WHEN TO USE WHAT (senior rules):
# fork     = journey alt branches (sequence diagram "alt") — label optional
# decision = user-flow if/else gate — condition on node, label on edge optional
# flow=     only when overriding auto (auto is default)

# --- Journey ---
note note_1 "Journey 1 – New Lead to First Class" banner
step step_1 "Submit lead form or walk in" actor=lead->mt
step step_2 "Welcome message sent" actor=ai->lead
step step_3 "Personalized intro offer" actor=ai->lead
fork fork_1

note_1 -> step_1
step_1 -> step_2
step_2 -> fork_1
fork_1 -> step_3 "Responds"
fork_1 -> step_2 when="No response"

# decision = if/else — condition text on node, paths on connectors
# action   = a single step — describe what happens in the node text
# fork     = journey alt branches only

# --- User flow ---
user member "Member or Lead" role=Member
screen landing "Lead Form"
action submit "Submit details" 
decision valid "Is the entry valid?"

member -> landing
landing -> submit
submit -> valid
valid -> step_1 when="Hand off"
valid -> submit when=Retry`;

export const JOURNEY1_FLOWCHART = `# Journey 1 — New Lead to First Class (Mermaid-style)
@layout down
@mode full
@style flowchart

action A "New lead" description="Form submitted or walk-in" class=neutral
action B "Send welcome message" description="Asks goals & hesitations" class=action
decision C "Lead responds?" class=neutral
action D "Send intro offer" description="+ payment link" class=action
action E "No purchase yet" description="Pitch sent after class" class=action
action F "Purchase intro offer" description="Conversion milestone" class=success
action G "Propose class times" description="Lead picks a slot" class=action
action H "Class booked" description="Reminder after 2h idle" class=action
action M "Manager briefing" description="First-timer summary" class=neutral
decision I "Attends class?" class=neutral
action J "Class locked in" description="Post-class check-in sent" class=success
action K "No-show recovery" description="Offers new time" class=risk
action L "Rebook or flag" description="Adjusts cadence" class=risk

A -> B
B -> C
C -> D "Yes"
C -> E "No"
D -> F
E -> F
F -> G
G -> H
H -> M style=dashed
H -> I
I -> J "Yes"
I -> K "No"
K -> L`;

function withFlowClass(data, attrs) {
  const flowClass = resolveFlowClass(attrs.class);
  return flowClass ? { ...data, flowClass } : data;
}

function parseAttrs(rest) {
  const attrs = {};
  let title = '';
  let remaining = rest.trim();

  const quoted = remaining.match(QUOTED_TITLE);
  if (quoted) {
    title = quoted[1] || quoted[2] || '';
    remaining = remaining.slice(quoted[0].length).trim();
  }

  const tokens = remaining.match(/(\w+)=("[^"]*"|'[^']*'|\S+)/g) || [];
  tokens.forEach((token) => {
    const eq = token.indexOf('=');
    const key = token.slice(0, eq).toLowerCase();
    let val = token.slice(eq + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    attrs[key] = val;
    remaining = remaining.replace(token, '').trim();
  });

  if (/\bautomated\b/.test(remaining)) attrs.automated = 'true';
  if (/\bside\b/.test(remaining)) attrs.variant = 'side';
  if (/\bbanner\b/.test(remaining)) attrs.variant = 'banner';

  return { title, attrs };
}

function parseActor(actorStr) {
  const ids = Object.keys(participants);
  const fallbackFrom = ids[0] || 'actor_a';
  const fallbackTo = ids[1] || ids[0] || 'actor_b';
  if (!actorStr) return { from: fallbackFrom, to: fallbackTo };
  const [from, to] = actorStr.split('->').map((s) => s.trim());
  return { from: from || fallbackFrom, to: to || fallbackTo };
}

function titleForNode(paletteType, title, attrs = {}) {
  const defaults = DEFAULT_NODE_DATA[paletteType] || DEFAULT_NODE_DATA.action;
  if (paletteType === 'step') {
    const actor = attrs.actor ? parseActor(attrs.actor) : { from: 'lead', to: 'ai' };
    const dashed = attrs.automated === 'true' || attrs.automated === '1';
    const kind = attrs.kind || inferStepKind({ from: actor.from, to: actor.to, dashed });
    return {
      type: 'step',
      from: actor.from,
      to: actor.to,
      text: title || 'Step',
      dashed,
      kind,
    };
  }
  if (paletteType === 'note') {
    return {
      type: 'note',
      text: title || 'Note',
      anchor: attrs.side === 'true' || attrs.variant === 'side' ? 'side' : null,
    };
  }
  if (paletteType === 'fork') {
    return { title: title || 'Alt branch', kind: 'alt' };
  }

  if (!title) return { ...defaults };

  switch (paletteType) {
    case 'user': return { ...defaults, name: title, role: attrs.role || defaults.role };
    case 'start':
    case 'end': return { ...defaults, title, variant: paletteType };
    case 'screen': return { ...defaults, title, subtitle: attrs.subtitle || '' };
    case 'text': return { ...defaults, text: title };
    case 'annotation': return { ...defaults, text: title };
    case 'entity': {
      const fields = attrs.fields ? attrs.fields.split(',').map((f) => f.trim()) : defaults.fields;
      return { ...defaults, title, fields };
    }
    default: return withFlowClass({ ...defaults, title, description: attrs.description || '' }, attrs);
  }
}

function journeyDimensions(paletteType, data) {
  if (paletteType === 'step') return { width: JOURNEY_NODE_W, height: STEP_H };
  if (paletteType === 'note') return { width: JOURNEY_NODE_W, height: data.anchor ? NOTE_H : BANNER_H };
  if (paletteType === 'fork') return { width: FORK_W, height: FORK_H };
  return {};
}

function buildNode(paletteType, codeId, title, attrs = {}) {
  const isJourney = ['step', 'note', 'fork'].includes(paletteType);
  const rfType = isJourney
    ? (paletteType === 'step' ? NODE_TYPES.STEP : paletteType === 'note' ? NODE_TYPES.NOTE : NODE_TYPES.FORK)
    : (RF_TYPE_MAP[paletteType] || NODE_TYPES.PROCESS);

  const data = titleForNode(paletteType, title, attrs);
  if (isJourney && paletteType === 'step' && attrs.step) {
    data.stepNum = parseInt(attrs.step, 10);
  }

  const dims = journeyDimensions(paletteType, data);
  const node = {
    id: `code-${codeId}`,
    type: rfType,
    position: { x: 0, y: 0 },
    data: isJourney ? data : { ...data, locked: false },
    ...dims,
  };

  if (paletteType === 'annotation') {
    node.style = { width: 160, height: 100 };
    node.zIndex = 5;
  }
  if (paletteType === 'text') {
    node.style = { width: Math.max(80, (title?.length || 5) * 8), height: 36 };
    node.zIndex = 6;
  }
  if (paletteType === 'screen') {
    node.style = { width: 260, height: 140 };
  }
  if (paletteType === 'action') {
    node.width = FLOW_ACTION_W;
    node.height = attrs.description ? FLOW_ACTION_H : 64;
  }
  if (paletteType === 'decision') {
    node.width = FLOW_DECISION;
    node.height = FLOW_DECISION;
  }
  return node;
}

export function codeIdForNode(node, counters = {}) {
  if (node.type === NODE_TYPES.STEP && node.data?.stepNum != null) {
    return `step_${node.data.stepNum}`;
  }
  if (node.type === NODE_TYPES.NOTE) {
    counters.note = (counters.note || 0) + 1;
    return `note_${counters.note}`;
  }
  if (node.type === NODE_TYPES.FORK) {
    counters.fork = (counters.fork || 0) + 1;
    return `fork_${counters.fork}`;
  }
  if (node.id.startsWith('code-')) return node.id.slice(5);
  return null;
}

function buildAliasMap(existingNodes) {
  const aliases = new Map();
  const counters = {};
  existingNodes.forEach((n) => {
    const codeId = codeIdForNode(n, counters);
    if (codeId) aliases.set(codeId, n.id);
  });
  return aliases;
}

function resolveNodeId(codeId, nodeMap, aliases) {
  if (nodeMap.has(codeId)) return nodeMap.get(codeId).id;
  if (aliases.has(codeId)) return aliases.get(codeId);
  return `code-${codeId}`;
}

export function parseDiagramCode(code, edgeStyle = 'smoothstep', options = {}) {
  const { existingNodes = [] } = options;
  const aliases = buildAliasMap(existingNodes);
  const errors = [];
  const warnings = [];
  const nodeMap = new Map();
  const journeyUpdates = [];
  const edges = [];
  const meta = { layout: 'right', mode: 'overlay', style: null };
  const lines = code.split('\n');

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) return;

    const metaMatch = line.match(META_LINE);
    if (metaMatch) {
      const [, key, val] = metaMatch;
      const v = val.toLowerCase();
      if (key.toLowerCase() === 'layout') {
        if (['right', 'left', 'down', 'up', 'td', 'tb'].includes(v)) {
          meta.layout = (v === 'td' || v === 'tb') ? 'down' : v;
        }
      }
      if (key.toLowerCase() === 'mode' && ['overlay', 'full'].includes(v)) {
        meta.mode = v;
      }
      if (key.toLowerCase() === 'style' && ['flowchart', 'journey'].includes(v)) {
        meta.style = v;
      }
      return;
    }

    const nodeMatch = line.match(NODE_LINE);
    if (nodeMatch) {
      const [, type, codeId, rest] = nodeMatch;
      const paletteType = type.toLowerCase() === 'process' ? 'action' : type.toLowerCase();
      if (nodeMap.has(codeId)) {
        errors.push(`Line ${i + 1}: duplicate id "${codeId}"`);
        return;
      }

      const { title, attrs } = parseAttrs(rest);
      const isJourney = ['step', 'note', 'fork'].includes(paletteType);

      if (isJourney && aliases.has(codeId)) {
        const existingId = aliases.get(codeId);
        const existing = existingNodes.find((n) => n.id === existingId);
        journeyUpdates.push({
          codeId,
          existingId,
          patch: titleForNode(paletteType, title, attrs),
          type: existing?.type,
        });
        nodeMap.set(codeId, { id: existingId, type: existing?.type, isAlias: true });
      } else {
        nodeMap.set(codeId, buildNode(paletteType, codeId, title, attrs));
      }
      return;
    }

    const edgeMatch = line.match(EDGE_LINE);
    if (edgeMatch) {
      const [, from, to, l1, l2, w1, w2, w3, flow, edgeStyle] = edgeMatch;
      const hasFrom = nodeMap.has(from) || aliases.has(from);
      const hasTo = nodeMap.has(to) || aliases.has(to);
      if (!hasFrom) errors.push(`Line ${i + 1}: unknown node "${from}"`);
      if (!hasTo) errors.push(`Line ${i + 1}: unknown node "${to}"`);
      if (!hasFrom || !hasTo) return;

      const source = resolveNodeId(from, nodeMap, aliases);
      const target = resolveNodeId(to, nodeMap, aliases);
      const label = l1 || l2 || w1 || w2 || w3 || '';
      const siblings = edges.filter((e) => e.source === source);

      const sourceNode = existingNodes.find((n) => n.id === source)
        || [...nodeMap.values()].find((n) => n.id === source);
      const targetNode = existingNodes.find((n) => n.id === target)
        || [...nodeMap.values()].find((n) => n.id === target);

      const isJourneyEdge = sourceNode && targetNode
        && JOURNEY_TYPES.has(sourceNode.type) && JOURNEY_TYPES.has(targetNode.type);

      if (isJourneyEdge || (sourceNode && JOURNEY_TYPES.has(sourceNode.type))
        || (targetNode && JOURNEY_TYPES.has(targetNode.type))) {
        const journeyData = inferJourneyEdgeData(sourceNode, targetNode, label);
        edges.push({
          id: `code-e-${from}-${to}-${edges.length}`,
          source,
          target,
          type: 'journey',
          animated: journeyData.animated,
          data: { ...journeyData, branchIndex: siblings.length, flowMode: 'auto' },
          ...resolveEdgeHandles(sourceNode, targetNode),
        });
        return;
      }

      const explicitFlow = flow && flow !== 'auto' ? flow : undefined;
      const edgeData = buildEdgeData({
        source: sourceNode,
        target: targetNode,
        siblings,
        explicitFlow,
        label,
      });

      const inferred = inferFlowType(sourceNode, targetNode, { explicitFlow });
      const useJourneyType = inferred === 'journey' || edgeData.journeyFlow;
      const edgeType = useJourneyType ? 'journey' : edgeStyle;

      edges.push({
        id: `code-e-${from}-${to}-${edges.length}`,
        source,
        target,
        type: edgeType,
        animated: edgeData.animated,
        data: {
          ...edgeData,
          flowMode: flow || 'auto',
          flowchart: meta.style === 'flowchart',
          edgeStyle: edgeStyle || null,
          auxiliary: edgeStyle === 'dashed' || edgeStyle === 'dotted',
        },
      });

      if (isForkNode(sourceNode) && !isJourneyNode(targetNode) && !label) {
        warnings.push(`Line ${i + 1}: fork -> user-flow without label — add when="..." if path needs a name`);
      }
      if (isDecisionNode(sourceNode) && !label) {
        // informational only — labels optional on decision branches
      }
      return;
    }

    errors.push(`Line ${i + 1}: unrecognized syntax`);
  });

  const newNodes = [...nodeMap.values()].filter((n) => !n.isAlias);

  if (!meta.style && newNodes.some((n) => n.data?.flowClass)) {
    meta.style = 'flowchart';
  }
  if (meta.style === 'flowchart') {
    edges.forEach((e) => {
      if (!e.data) e.data = {};
      e.data.flowchart = true;
    });
  }

  return {
    nodes: newNodes,
    edges,
    journeyUpdates,
    meta,
    errors,
    warnings,
    ok: errors.length === 0 && (newNodes.length > 0 || journeyUpdates.length > 0 || edges.length > 0),
  };
}

function nodeLabel(node) {
  const d = node.data || {};
  switch (node.type) {
    case NODE_TYPES.USER: return d.name || 'User';
    case NODE_TYPES.TERMINAL: return d.title || (d.variant === 'end' ? 'End' : 'Start');
    case NODE_TYPES.TEXT: return d.text || 'Text';
    case NODE_TYPES.ANNOTATION: return d.text || 'Note';
    case NODE_TYPES.ENTITY: return d.title || 'Entity';
    case NODE_TYPES.STEP: return d.text || 'Step';
    case NODE_TYPES.NOTE: return d.text || 'Note';
    case NODE_TYPES.FORK: return d.title || 'Alt branch';
    default: return d.title || node.type;
  }
}

function attrsForNode(node) {
  const d = node.data || {};
  const parts = [];
  if (node.type === NODE_TYPES.USER && d.role) parts.push(`role=${d.role}`);
  if (node.type === NODE_TYPES.SCREEN && d.subtitle) parts.push(`subtitle="${d.subtitle}"`);
  if (node.type === NODE_TYPES.ENTITY && d.fields?.length) {
    parts.push(`fields=${d.fields.join(',')}`);
  }
  if (node.type === NODE_TYPES.STEP) {
    parts.push(`actor=${d.from || 'lead'}->${d.to || 'ai'}`);
    if (d.kind && d.kind !== STEP_KIND.MESSAGE) parts.push(`kind=${d.kind}`);
    if (d.dashed) parts.push('automated');
  }
  if (node.type === NODE_TYPES.NOTE && d.anchor) parts.push('side');
  if (node.type === NODE_TYPES.NOTE && !d.anchor) parts.push('banner');
  if (d.flowClass) parts.push(`class=${d.flowClass}`);
  if (d.description && node.type !== NODE_TYPES.STEP) parts.push(`description="${d.description.replace(/"/g, "'")}"`);
  return parts.length ? ` ${parts.join(' ')}` : '';
}

function paletteTypeFromNode(node) {
  if (node.type === NODE_TYPES.TERMINAL) return node.data?.variant === 'end' ? 'end' : 'start';
  if (node.type === NODE_TYPES.USER) return 'user';
  if (node.type === NODE_TYPES.ACTION || node.type === NODE_TYPES.PROCESS) return 'action';
  if (node.type === NODE_TYPES.DECISION) return 'decision';
  if (node.type === NODE_TYPES.IO) return 'io';
  if (node.type === NODE_TYPES.SCREEN) return 'screen';
  if (node.type === NODE_TYPES.ANNOTATION) return 'annotation';
  if (node.type === NODE_TYPES.TEXT) return 'text';
  if (node.type === NODE_TYPES.ENTITY) return 'entity';
  if (node.type === NODE_TYPES.STEP) return 'step';
  if (node.type === NODE_TYPES.NOTE) return 'note';
  if (node.type === NODE_TYPES.FORK) return 'fork';
  return null;
}

export function serializeDiagramCode(nodes, edges, options = {}) {
  const { includeJourney = true } = options;
  if (!nodes.length) return EXAMPLE;

  const idToCode = new Map();
  const counters = {};
  const lines = ['# Compass Diagram Code', '@layout right', '@mode overlay', ''];

  const journeyNodes = nodes.filter((n) => JOURNEY_TYPES.has(n.type));
  const diagramNodes = nodes.filter((n) => !JOURNEY_TYPES.has(n.type));

  const register = (n) => {
    const palette = paletteTypeFromNode(n);
    if (!palette) return;
    let codeId = codeIdForNode(n, counters);
    if (!codeId) {
      codeId = n.id.startsWith('code-') ? n.id.slice(5) : `n_${idToCode.size + 1}`;
    }
    let suffix = 1;
    const base = codeId;
    while ([...idToCode.values()].includes(codeId)) {
      codeId = `${base}_${suffix++}`;
    }
    idToCode.set(n.id, codeId);
    return { palette, codeId, label: nodeLabel(n).replace(/"/g, "'") };
  };

  if (includeJourney && journeyNodes.length) {
    lines.push('# --- Journey ---');
    journeyNodes.forEach((n) => {
      const r = register(n);
      if (r) lines.push(`${r.palette} ${r.codeId} "${r.label}"${attrsForNode(n)}`);
    });
    lines.push('');
  }

  if (diagramNodes.length) {
    lines.push('# --- User Flow ---');
    diagramNodes.forEach((n) => {
      const r = register(n);
      if (r) lines.push(`${r.palette} ${r.codeId} "${r.label}"${attrsForNode(n)}`);
    });
    lines.push('');
  }

  if (lines[lines.length - 1] === '') lines.pop();
  lines.push('');

  edges.forEach((e) => {
    const from = idToCode.get(e.source);
    const to = idToCode.get(e.target);
    if (!from || !to) return;
    const label = e.data?.label || e.label;
    const isJourney = e.type === 'journey' || e.data?.journeyFlow;
    const flowMode = e.data?.flowMode;
    const autoFlow = inferFlowType(
      nodes.find((n) => n.id === e.source),
      nodes.find((n) => n.id === e.target),
    );

    let line = `${from} -> ${to}`;
    if (label) line += ` "${label}"`;
    else if (flowMode === 'auto' && !isJourney) {
      // no label, auto flow — omit flow=
    }

    if (e.data?.edgeStyle === 'dashed' || e.data?.edgeStyle === 'dotted') {
      line += ` style=${e.data.edgeStyle}`;
    }

    const explicitNeeded = flowMode && flowMode !== 'auto'
      || (isJourney && autoFlow !== 'journey')
      || (!isJourney && e.data?.flowType && e.data.flowType !== autoFlow);

    if (explicitNeeded) {
      if (isJourney || flowMode === 'journey') line += ' flow=journey';
      else if (e.data?.flowType) line += ` flow=${e.data.flowType}`;
    }

    lines.push(line);
  });

  return lines.join('\n');
}

export function splitJourneyAndDiagram(nodes, edges) {
  const journeyNodes = nodes.filter((n) => JOURNEY_TYPES.has(n.type));
  const diagramNodes = nodes.filter((n) => !JOURNEY_TYPES.has(n.type));
  const journeyIds = new Set(journeyNodes.map((n) => n.id));
  const diagramIds = new Set(diagramNodes.map((n) => n.id));
  const journeyEdges = edges.filter((e) => journeyIds.has(e.source) && journeyIds.has(e.target));
  const diagramEdges = edges.filter((e) => diagramIds.has(e.source) && diagramIds.has(e.target));
  const crossEdges = edges.filter((e) => {
    const srcJ = journeyIds.has(e.source);
    const tgtJ = journeyIds.has(e.target);
    return srcJ !== tgtJ;
  });
  return { journeyNodes, diagramNodes, journeyEdges, diagramEdges, crossEdges };
}

function applyJourneyUpdates(journeyNodes, updates) {
  if (!updates.length) return journeyNodes;
  return journeyNodes.map((n) => {
    const upd = updates.find((u) => u.existingId === n.id);
    if (!upd) return n;
    return { ...n, data: { ...n.data, ...upd.patch } };
  });
}

function offsetDiagramNodes(diagramNodes, journeyNodes) {
  if (!journeyNodes.length || !diagramNodes.length) return diagramNodes;
  const maxX = Math.max(...journeyNodes.map((n) => (n.position?.x || 0) + (n.width || n.style?.width || JOURNEY_NODE_W)));
  const minY = Math.min(...journeyNodes.map((n) => n.position?.y || 0));
  const laidMinX = Math.min(...diagramNodes.map((n) => n.position?.x || 0));
  const offsetX = maxX + 140 - laidMinX;
  return diagramNodes.map((n) => ({
    ...n,
    position: { x: (n.position?.x || 0) + offsetX, y: (n.position?.y || 0) + minY },
  }));
}

export async function mergeBoardFromCode(parsed, currentNodes, currentEdges, layoutFn) {
  const { meta, nodes: parsedNodes, edges: parsedEdges, journeyUpdates } = parsed;
  const { journeyNodes, journeyEdges, crossEdges } = splitJourneyAndDiagram(
    currentNodes,
    currentEdges,
  );

  if (meta.mode === 'full') {
    const laid = await layoutFn(parsedNodes, parsedEdges, meta.layout);
    return {
      nodes: laid.nodes,
      edges: normalizeFlowchartEdgeHandles(laid.nodes, parsedEdges, meta.layout),
      warnings: parsed.warnings,
    };
  }

  const updatedJourney = applyJourneyUpdates(journeyNodes, journeyUpdates);
  const parsedDiagram = parsedNodes.filter((n) => !JOURNEY_TYPES.has(n.type));
  const parsedJourneyNew = parsedNodes.filter((n) => JOURNEY_TYPES.has(n.type));

  let finalJourney = [...updatedJourney];
  if (parsedJourneyNew.length) {
    const existingIds = new Set(updatedJourney.map((n) => n.id));
    parsedJourneyNew.forEach((n) => {
      if (!existingIds.has(n.id)) finalJourney.push(n);
    });
  }

  const toLayout = parsedDiagram.length ? parsedDiagram : [];
  let laidDiagram = toLayout;
  const diagramOnlyEdges = parsedEdges.filter((e) => {
    const srcJ = JOURNEY_TYPES.has(
      parsedNodes.find((n) => n.id === e.source)?.type
      || finalJourney.find((n) => n.id === e.source)?.type,
    );
    const tgtJ = JOURNEY_TYPES.has(
      parsedNodes.find((n) => n.id === e.target)?.type
      || finalJourney.find((n) => n.id === e.target)?.type,
    );
    return !srcJ || !tgtJ;
  });

  if (toLayout.length) {
    const laid = await layoutFn(toLayout, diagramOnlyEdges.filter((e) => {
      const ids = new Set(toLayout.map((n) => n.id));
      return ids.has(e.source) && ids.has(e.target);
    }), meta.layout);
    laidDiagram = offsetDiagramNodes(laid.nodes, finalJourney);
  }

  const allIds = new Set([...finalJourney, ...laidDiagram].map((n) => n.id));
  const journeyIds = new Set(finalJourney.map((n) => n.id));
  const diagramIds = new Set(laidDiagram.map((n) => n.id));

  const finalEdges = [];
  const seen = new Set();

  const pushEdge = (e) => {
    const key = `${e.source}|${e.target}|${e.data?.label || e.label || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    finalEdges.push(e);
  };

  parsedEdges
    .filter((e) => journeyIds.has(e.source) && journeyIds.has(e.target))
    .forEach(pushEdge);

  journeyEdges.forEach((e) => {
    if (!parsedEdges.some((p) => p.source === e.source && p.target === e.target)) pushEdge(e);
  });

  parsedEdges
    .filter((e) => diagramIds.has(e.source) && diagramIds.has(e.target))
    .forEach(pushEdge);

  parsedEdges
    .filter((e) => {
      const sJ = journeyIds.has(e.source);
      const tJ = journeyIds.has(e.target);
      const sD = diagramIds.has(e.source);
      const tD = diagramIds.has(e.target);
      return (sJ && tD) || (sD && tJ);
    })
    .forEach(pushEdge);

  crossEdges
    .filter((e) => allIds.has(e.source) && allIds.has(e.target))
    .forEach(pushEdge);

  return {
    nodes: [...finalJourney, ...laidDiagram],
    edges: normalizeFlowchartEdgeHandles([...finalJourney, ...laidDiagram], finalEdges, meta.layout),
    warnings: parsed.warnings,
  };
}

export { EXAMPLE as DIAGRAM_CODE_EXAMPLE };

export const SYNTAX_REFERENCE = `# Directives
@layout right|left|down|up|td
@mode overlay|full
@style flowchart|journey

# Mermaid-style flowchart (action + decision + class)
action signup "Send welcome" description="Optional subtitle" class=action
decision valid "Lead responds?" class=neutral
# class: neutral | action | success | risk

# Journey nodes (swimlane sequence)
step step_1 "Description" actor=lead->ai automated
note note_1 "Banner" banner
fork fork_1

# Edges — labels on decision paths, dashed auxiliary lines
a -> b
valid -> retry "Yes"
h -> m style=dashed

# Actors: lead, ai, mt, mgr, ghl`;
