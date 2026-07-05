import { participants } from '../data/journeys';

export const AUTO_LABEL = 'Happens automatically';
export const AUTO_HINT = 'Systems stay in sync — no manual action needed';

const FALLBACK_COLORS = ['sky', 'brand', 'slate', 'amber', 'teal'];

export function resolveActor(id, registry = participants) {
  if (!id) return null;
  if (registry[id]) return registry[id];
  const hash = [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return {
    id,
    label: id,
    short: id,
    description: '',
    color: FALLBACK_COLORS[hash % FALLBACK_COLORS.length],
  };
}

export function getActor(id) {
  return resolveActor(id);
}

export function getActorIds(nodes = [], registry = participants) {
  const ids = new Set(Object.keys(registry));
  nodes.forEach((n) => {
    if (n.type !== 'step') return;
    if (n.data?.from) ids.add(n.data.from);
    if (n.data?.to) ids.add(n.data.to);
  });
  return [...ids].sort();
}

export function describeFlow(fromId, toId, dashed) {
  const from = resolveActor(fromId);
  const to = resolveActor(toId);
  if (!from || !to) return '';
  if (dashed) return `${from.label} notifies ${to.label} in the background`;
  return `${from.label} communicates with ${to.label}`;
}

export const actorIcons = {
  lead: 'User',
  ai: 'Bot',
  mt: 'Calendar',
  mgr: 'Users',
  ghl: 'BarChart3',
};
