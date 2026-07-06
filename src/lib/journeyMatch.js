import { journeys } from '../data/journeys';

export function resolveJourneyIndex(journeyId) {
  if (!journeyId) return -1;
  let idx = journeys.findIndex((x) => x.id === journeyId);
  if (idx >= 0) return idx;
  const m = /^journey-(\d+)$/.exec(journeyId);
  if (m) {
    const n = Number.parseInt(m[1], 10);
    if (n >= 0 && n < journeys.length) return n;
  }
  return -1;
}

export function journeyIdsMatch(a, b) {
  if (!a || !b) return a === b;
  if (a === b) return true;
  const ai = resolveJourneyIndex(a);
  const bi = resolveJourneyIndex(b);
  return ai >= 0 && ai === bi;
}
