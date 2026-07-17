// Test plan content — mirrors NineDean research/14-user-journey-test-plan.md.
// Static, reviewer-facing. Grouped by journey stage; each case ties to the edge cases in datasets.js.

export const testLevels = [
  { level: 'Unit', scope: 'engine math, parsing, validation helpers', tool: 'pytest', status: 'exists' },
  { level: 'Integration', scope: 'route contract, DB, A→B→C cascade', tool: 'pytest + TestClient', status: 'exists' },
  { level: 'Data quality', scope: 'census schema, edge cases, fallback ledger', tool: 'pytest + edge datasets', status: 'partial' },
  { level: 'E2E (user journey)', scope: 'U1–U8 in a browser', tool: 'Playwright', status: 'gap' },
  { level: 'Smoke', scope: 'upload→run→verdict on a running server', tool: 'Playwright subset', status: 'gap' },
  { level: 'Regression', scope: 'golden fixture byte-identical', tool: 'pytest golden', status: 'exists' },
];

// Deal-team click path (the USER journey the UI cases are written against).
export const userPath = [
  { id: 'U1', step: 'Authenticate', where: 'POST /api/login', note: 'fail-closed — empty user table admits nobody' },
  { id: 'U2', step: 'Upload census', where: 'POST /api/preview', note: 'verbatim preview, nothing normalized yet' },
  { id: 'U3', step: 'Persist + review', where: 'POST /api/census → CensusReview', note: 'record in review status; flagged rows surfaced' },
  { id: 'U4', step: 'Correct flagged rows', where: 'POST /api/census/{id}/corrections', note: 'each correction logged' },
  { id: 'U5', step: 'Run the engines', where: 'POST /api/census/{id}/run', note: 'A→B→C cascade; status → final' },
  { id: 'U6', step: 'Read the verdict', where: 'GET /api/runs/{id}', note: 'remediation (A+B) + healthcare pass/fail' },
  { id: 'U7', step: 'Export', where: 'run view → model', note: 'structured paste into acquisition model' },
  { id: 'U8', step: 'Share / manage', where: 'POST /api/runs/{id}/shares', note: 'owner-only share; ADMIN/ADVISOR roles' },
];

// Test cases grouped by engine/stage.
export const testGroups = [
  {
    stage: 'Stage 0 — Upload & Normalization',
    cases: [
      { id: 'T-N1', assert: 'Verbatim preview returns every original column unchanged', edges: ['59-col template', 'newline headers'] },
      { id: 'T-N2', assert: 'Parser maps aliases two-pass (exact→substring), order-sensitive', edges: ['E1', 'E6'] },
      { id: 'T-N3', assert: 'Every default/rejection lands in the fallback ledger — no silent drop', edges: ['E3'] },
      { id: 'T-N4', assert: 'Exempt status parsed correctly', edges: ['E2'] },
      { id: 'T-N5', assert: 'County resolved from ZIP; split-ZIP + home-office fallback', edges: ['E9', 'E10', 'E11'] },
      { id: 'T-N6', assert: 'Corrections persist + re-derive; review→final only after run', edges: ['E7'] },
    ],
  },
  {
    stage: 'Stage 1 — Fair Pay Engine A',
    cases: [
      { id: 'T-A1', assert: 'Basket = MAX(MIT, EPI, ACS…); CNT transport is override not MAX', edges: ['E12'] },
      { id: 'T-A2', assert: 'Gross-up floored at max(0,…) — never negative', edges: ['E13'] },
      { id: 'T-A3', assert: 'Tax inputs derived from the same household as the basket', edges: ['E14', 'E15'] },
      { id: 'T-A4', assert: 'Local-tax states flagged (PolicyEngine is state-level)', edges: ['E17'] },
      { id: 'T-A5', assert: 'Only in-scope (non-exempt) employees counted', edges: ['E2', 'E8'] },
    ],
  },
  {
    stage: 'Stage 2 — PSL (B) + Healthcare (C), parallel',
    cases: [
      { id: 'T-B1', assert: 'PSL floor per jurisdiction; preempted/no-cap → floor 0', edges: ['E18', 'E19', 'E20'] },
      { id: 'T-B2', assert: 'Non-exempt cost = hours-below × rate; PT prorated to 2080h', edges: ['E21'] },
      { id: 'T-B3', assert: "B accumulates on A's raised wages (cascade)", edges: ['E13'] },
      { id: 'T-C1', assert: 'Benchmarks 1/2A/2B per plan; verdict affordable/review/fail', edges: ['E23', 'E24'] },
      { id: 'T-C2', assert: 'ACA/IRS affordability (9.02% 2025 / 9.96% 2026); grandfathered flagged', edges: ['E26'] },
      { id: 'T-C3', assert: 'HSA employer contribution NOT counted as medical employer contribution', edges: ['E6'] },
    ],
  },
  {
    stage: 'Stage 3 — Output & Cross-cutting',
    cases: [
      { id: 'T-O1', assert: 'Total remediation = A + B; healthcare pass/fail separate', edges: ['E18'] },
      { id: 'T-O2', assert: 'run_id threads the chain; methodology version snapshotted; audit complete', edges: [] },
      { id: 'T-O3', assert: 'Owner-only share management; ADMIN sees all, ADVISOR own+shared', edges: [] },
    ],
  },
];

export const testMeta = {
  status: 'DRAFT — pending team approval',
  source: 'NineDean research/14-user-journey-test-plan.md',
};
