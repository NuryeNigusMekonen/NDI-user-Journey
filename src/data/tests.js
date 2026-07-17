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

// Manual / UAT cases (§4) — the human-run half automation can't judge.
export const manualCases = [
  { id: 'M-1', case: 'Login fail-closed', expected: 'No users seeded → access denied, no default login' },
  { id: 'M-2', case: 'Upload & preview', expected: 'Verbatim preview shows every column, unchanged' },
  { id: 'M-3', case: 'Flagged-row review', expected: 'Flagged/rejected rows visible with a readable reason; none silently missing' },
  { id: 'M-4', case: 'Correction flow', expected: 'Correction persists, logged, re-derives; status review→final' },
  { id: 'M-5', case: 'Verdict readability', expected: 'Remediation (A+B) + per-plan healthcare pass/fail clear + correctly labeled' },
  { id: 'M-6', case: 'Export', expected: 'Structured output pastes cleanly into the acquisition model' },
  { id: 'M-7', case: 'Degraded run banner', expected: 'UI shows degraded clearly, not a silent full-confidence number' },
  { id: 'M-8', case: 'ADVISOR run isolation', expected: 'Cannot see another advisor’s unshared run' },
  { id: 'M-9', case: 'ADMIN full visibility', expected: 'ADMIN sees all runs' },
  { id: 'M-10', case: 'Owner-only share mgmt', expected: 'A non-owner cannot add/remove shares' },
  { id: 'M-11', case: 'Invite / reset flows', expected: 'Invite link + password reset work and expire correctly' },
];

export const uat = {
  note: 'A deal-team member runs one or two REAL deal censuses end-to-end and confirms the output is usable in the acquisition model. Sign-off recorded.',
  exit: 'Deal team accepts the verdict format + the remediation number’s presentation.',
};

// Frontend E2E automation design (§5) — Playwright, DESIGN ONLY (no code yet).
export const e2eFlows = [
  { id: 'E2E-1', flow: 'Happy path — login → upload clean census → run → verdict → export', covers: 'U1–U7 · smoke' },
  { id: 'E2E-2', flow: 'Flagged-review — upload edge census → review → correct → run', covers: 'U3–U5' },
  { id: 'E2E-3', flow: 'Auth/roles — ADVISOR cannot see another’s run; ADMIN can', covers: 'U8 · authz' },
  { id: 'E2E-4', flow: 'Sharing — owner shares → sharee sees it → non-owner can’t unshare', covers: 'U8' },
  { id: 'E2E-5', flow: 'Invite/reset — admin invites → accept-invite → login', covers: 'U8' },
];

// Non-functional testing (§6).
export const nonFunctional = [
  { type: 'Performance', case: '200-employee census runs in acceptable time', priority: 'P2' },
  { type: 'Security · authz', case: 'ADVISOR cannot reach another’s run via the API directly', priority: 'P1' },
  { type: 'Security · PII', case: 'No PII/secret in logs or client responses', priority: 'P1' },
  { type: 'Reproducibility', case: 'Same census + methodology version → same number', priority: 'P1' },
  { type: 'Accessibility', case: 'Keyboard nav + labels on upload/review screens', priority: 'P3' },
];

export const testMeta = {
  status: 'DRAFT — pending team approval',
  source: 'NineDean research/16-test-strategy.md',
  note: 'E2E is design-only (no test code yet). Manual/UAT run on staging.',
};
