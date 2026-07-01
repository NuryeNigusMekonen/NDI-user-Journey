/**
 * Parses journey items into navigable segments (source of truth: journeys.js).
 */

export function parseSegments(items) {
  const segments = [];
  for (const item of items) {
    if (item.type === 'step') {
      segments.push({ kind: 'step', data: item });
    } else if (item.type === 'note') {
      segments.push({ kind: 'note', data: item });
    } else if (item.type === 'alt') {
      segments.push({
        kind: 'decision',
        branches: item.branches.map((b) => ({
          label: b.label,
          else: b.else,
          segments: parseSegments(b.steps),
        })),
      });
    }
  }
  return segments;
}

export function buildSections(items) {
  const sections = [];
  let current = null;

  for (const item of items) {
    if (item.type === 'note' && !item.anchor) {
      if (current?.items.length) sections.push(current);
      current = { title: item.text, items: [] };
    } else {
      if (!current) current = { title: 'Flow', items: [] };
      current.items.push(item);
    }
  }
  if (current?.items.length) sections.push(current);
  return sections;
}

export function countSteps(segments) {
  let n = 0;
  for (const s of segments) {
    if (s.kind === 'step') n += 1;
    else if (s.kind === 'decision') {
      for (const b of s.branches) n += countSteps(b.segments);
    }
  }
  return n;
}

export function flattenGuideFrames(segments, stepRef = { n: 0 }) {
  const frames = [];
  for (const s of segments) {
    if (s.kind === 'step') {
      stepRef.n += 1;
      frames.push({ kind: 'step', data: s.data, stepNum: stepRef.n });
    } else if (s.kind === 'note') {
      frames.push({ kind: 'note', data: s.data });
    } else if (s.kind === 'decision') {
      frames.push({
        kind: 'decision',
        branches: s.branches.map((b) => ({
          label: b.label,
          else: b.else,
          frames: flattenGuideFrames(b.segments, stepRef),
          stepCount: countSteps(b.segments),
        })),
      });
    }
  }
  return frames;
}
