import { participants } from '../data/journeys';

export const AUTO_LABEL = 'Happens automatically';
export const AUTO_HINT = 'Systems stay in sync — no manual action needed';

export function getActor(id) {
  return participants[id];
}

export function describeFlow(fromId, toId, dashed) {
  const from = participants[fromId];
  const to = participants[toId];
  if (dashed) {
    return `${from.label} notifies ${to.label} in the background`;
  }
  return `${from.label} communicates with ${to.label}`;
}

export const actorIcons = {
  lead: 'User',
  ai: 'Bot',
  mt: 'Calendar',
  mgr: 'Users',
  ghl: 'BarChart3',
};
