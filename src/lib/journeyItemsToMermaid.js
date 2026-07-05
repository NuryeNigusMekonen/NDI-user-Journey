import { inferStepKind, STEP_KIND } from '../types/journeySemantics';
import { JOURNEY1_MERMAID } from './mermaidImport';
import { hasBrokenLayout } from './layoutOverlap';

const CLASS_DEFS = `    classDef neutral fill:#F1EFE8,stroke:#5F5E5A,color:#2C2C2A
    classDef action fill:#EEEDFE,stroke:#534AB7,color:#26215C
    classDef success fill:#EAF3DE,stroke:#3B6D11,color:#173404
    classDef risk fill:#FAECE7,stroke:#993C1D,color:#4A1B0C`;

function escapeLabel(text) {
  return (text || '')
    .replace(/"/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

function formatNodeLabel(text) {
  const clean = escapeLabel(text);
  if (clean.length <= 44) return clean;
  const breakAt = clean.lastIndexOf(' ', 44);
  if (breakAt > 24) {
    return `${clean.slice(0, breakAt)}<br/>${clean.slice(breakAt + 1, breakAt + 45)}`;
  }
  return `${clean.slice(0, 44)}<br/>${clean.slice(44, 88)}`;
}

function kindToClass(kind, isNote) {
  if (isNote) return 'neutral';
  if (kind === STEP_KIND.HANDOFF) return 'neutral';
  if (kind === STEP_KIND.SYSTEM) return 'neutral';
  return 'action';
}

function shortenDecisionLabel(branches) {
  const labels = branches.map((b) => b.label).filter(Boolean);
  if (!labels.length) return 'Branch?';
  if (labels.length === 1) return formatNodeLabel(labels[0]);
  const first = labels[0];
  if (first.length <= 36) return formatNodeLabel(first);
  return formatNodeLabel(`${first.slice(0, 32)}…`);
}

/** Convert journey DSL items → native Mermaid flowchart (same style as Journey 1) */
export function journeyItemsToMermaid(journey) {
  if (!journey?.items?.length) return null;

  const nodes = [];
  const edges = [];
  let counter = 0;
  const nid = () => {
    counter += 1;
    return `n${counter}`;
  };

  function walk(seq, preds) {
    let front = preds;
    for (const item of seq) {
      if (item.type === 'branch-group') continue;

      if (item.type === 'step') {
        const id = nid();
        const kind = inferStepKind(item);
        nodes.push({
          id,
          shape: 'rect',
          label: formatNodeLabel(item.text),
          flowClass: kindToClass(kind),
        });
        for (const p of front) {
          if (p.id) {
            edges.push({
              from: p.id,
              to: id,
              label: p.label || '',
              dashed: p.dashed || item.dashed,
            });
          }
        }
        front = [{ id, dashed: false }];
      } else if (item.type === 'note') {
        const id = nid();
        nodes.push({
          id,
          shape: 'rect',
          label: formatNodeLabel(item.text),
          flowClass: 'neutral',
        });
        for (const p of front) {
          if (p.id) {
            edges.push({
              from: p.id,
              to: id,
              label: p.label || '',
              dashed: p.dashed,
            });
          }
        }
        front = [{ id, dashed: false }];
      } else if (item.type === 'alt') {
        const forkId = nid();
        nodes.push({
          id: forkId,
          shape: 'diamond',
          label: shortenDecisionLabel(item.branches),
          flowClass: 'neutral',
        });
        for (const p of front) {
          if (p.id) {
            edges.push({ from: p.id, to: forkId, label: p.label || '', dashed: p.dashed });
          }
        }
        const next = [];
        for (const b of item.branches) {
          const ends = walk(b.steps, [{ id: forkId, label: b.label, dashed: false }]);
          next.push(...ends);
        }
        if (next.length) front = next;
      }
    }
    return front;
  }

  walk(journey.items, [{ id: null }]);

  if (!nodes.length) return null;

  const lines = ['flowchart LR', ''];
  nodes.forEach((n) => {
    if (n.shape === 'diamond') {
      lines.push(`    ${n.id}{${n.label}}`);
    } else {
      lines.push(`    ${n.id}[${n.label}]`);
    }
  });

  lines.push('');
  edges.forEach((e) => {
    const arrow = e.dashed ? '-.->' : '-->';
    const lbl = escapeLabel(e.label);
    if (lbl) lines.push(`    ${e.from} ${arrow}|${lbl}| ${e.to}`);
    else lines.push(`    ${e.from} ${arrow} ${e.to}`);
  });

  lines.push('');
  lines.push(CLASS_DEFS);

  const byClass = { neutral: [], action: [], success: [], risk: [] };
  nodes.forEach((n) => {
    if (byClass[n.flowClass]) byClass[n.flowClass].push(n.id);
  });
  Object.entries(byClass).forEach(([cls, ids]) => {
    if (ids.length) lines.push(`    class ${ids.join(',')} ${cls}`);
  });

  return lines.join('\n');
}

const HAND_CRAFTED = {
  'new-lead-first-class': JOURNEY1_MERMAID,
};

export function getDefaultMermaidForJourney(journey) {
  if (!journey) return null;
  if (HAND_CRAFTED[journey.id]) return HAND_CRAFTED[journey.id];
  return journeyItemsToMermaid(journey);
}

export function isSwimlaneBoard(nodes = []) {
  return nodes.some((n) => n.type === 'step' || n.type === 'note' || n.type === 'fork');
}

export function shouldBootstrapMermaidFlowchart(saved, journey = null) {
  const journeyId = journey?.id;

  if (saved?.mermaidSource && saved?.nodes?.length && !hasBrokenLayout(saved.nodes)) {
    if (journeyId === 'new-lead-first-class') return false;
    if (!saved.mermaidSource.trim().startsWith('flowchart LR')) return true;
    return false;
  }

  if (saved?.mermaidSource && hasBrokenLayout(saved?.nodes)) return true;
  if (!saved?.nodes?.length) return true;
  if (isSwimlaneBoard(saved.nodes)) return true;
  if (saved.nodes.some((n) => n.id?.startsWith('mmd-') || n.data?.flowchart)) return true;
  return false;
}
