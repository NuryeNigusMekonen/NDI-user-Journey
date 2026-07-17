// Simulated census dataset catalog — mirrors NineDean research/15-edge-case-census-spec.md
// and the generated backend/fixtures/ suite. Static, reviewer-facing.

export const datasetFiles = [
  { name: 'clean_baseline', rows: 4, purpose: 'Happy path — every engine gives a sane number', outcome: '0 rejects, all engines fire' },
  { name: 'edge_ingestion', rows: 9, purpose: 'E1–E8: coding, E/N exempt, blank-Code, dupes, HSA', outcome: 'blank-Code → rejected not dropped' },
  { name: 'edge_geo', rows: 3, purpose: 'E9–E12: unresolvable ZIP, cross-border, uncovered county', outcome: 'fallbacks flagged; degraded=true' },
  { name: 'edge_fairpay_tax', rows: 6, purpose: 'E13–E17: negative gross-up, tiers, waived, local tax', outcome: 'floor never < basket; tax flags' },
  { name: 'edge_psl', rows: 6, purpose: 'E18–E22: preempted, no-cap, capped, part-time, exempt', outcome: 'correct floors per jurisdiction' },
  { name: 'edge_healthcare', rows: 5, purpose: 'E23–E27: employer share, HDHP, non-compliant, waived', outcome: 'verdicts affordable/review/fail' },
  { name: 'scale_large', rows: 80, purpose: 'Volume / performance', outcome: 'runs end-to-end' },
  { name: 'all_combined', rows: 18, purpose: 'Regression smoke — one of each concern', outcome: 'full-suite check' },
];

// The input variations (E1–E27), each traced to a verified engine behavior.
export const edgeVariations = [
  { group: 'A · Ingestion / normalization', items: [
    { id: 'E1', variation: 'Abbreviation-coded labels', expected: 'Alias two-pass still maps them' },
    { id: 'E2', variation: 'Exempt as E / N single letters', expected: 'Parsed; exempt excluded from scope' },
    { id: 'E3', variation: 'Blank Code row that still carries data', expected: 'Flagged + rejected, never dropped' },
    { id: 'E4', variation: 'Fully empty padding row', expected: 'Skipped as padding' },
    { id: 'E5', variation: 'Duplicate Code', expected: 'Disambiguated, no silent merge' },
    { id: 'E6', variation: 'HSA employer contribution column present', expected: 'Not counted as medical employer contribution' },
    { id: 'E7', variation: 'Missing dependent tier on a plan-holder', expected: 'Defaults single + flag' },
    { id: 'E8', variation: 'Unknown exempt status', expected: 'Defaults in-scope + flag' },
  ]},
  { group: 'B · Geo / county', items: [
    { id: 'E9', variation: 'Unresolvable / missing residence ZIP', expected: 'Home-office fallback, flagged' },
    { id: 'E10', variation: 'Split-ZIP (spans counties)', expected: 'Resolved via land-area share' },
    { id: 'E11', variation: 'Cross-border commuter (residence ≠ work state)', expected: 'County only if state-consistent, else flagged' },
    { id: 'E12', variation: 'Uncovered county (no basket data)', expected: 'Degraded basket, flagged' },
  ]},
  { group: 'C · Fair Pay / tax', items: [
    { id: 'E13', variation: 'Low-wage large family (credits drive tax negative)', expected: 'Gross-up floored at 0; floor ≥ basket' },
    { id: 'E14', variation: 'All four tiers EE / ES / EC / EF', expected: 'filing_status from tier; dependents from enrollment' },
    { id: 'E15', variation: 'Waived / unknown coverage', expected: 'Methodology default household, flagged' },
    { id: 'E16', variation: 'Enrollment vs tier mismatch', expected: 'Falls back to tier base children, flagged' },
    { id: 'E17', variation: 'Local-income-tax states (OH/PA/MI; MD/IN county)', expected: 'Flagged where uncaptured' },
  ]},
  { group: 'D · PSL', items: [
    { id: 'E18', variation: 'Preempted state (TX/FL/GA/WI)', expected: 'PSL floor 0' },
    { id: 'E19', variation: 'No-cap accrual state (WA)', expected: 'Floor 0' },
    { id: 'E20', variation: 'Capped states (CA 40h, NY 56h, AZ/IL 40h)', expected: 'Floor applied; gap costed' },
    { id: 'E21', variation: 'Part-time (1040h)', expected: 'Entitlement prorated to 2080h (→50%)' },
    { id: 'E22', variation: 'Exempt employee', expected: 'Out of PSL scope' },
  ]},
  { group: 'E · Healthcare', items: [
    { id: 'E23', variation: 'Low employer share (~50%)', expected: 'Benchmark 1 fail → verdict review' },
    { id: 'E24', variation: 'High employer share (~90–100%)', expected: 'Verdict affordable' },
    { id: 'E25', variation: 'HDHP plan choice', expected: 'Do not fail Layer B on HDHP-as-preference' },
    { id: 'E26', variation: 'Grandfathered / non-compliant plan', expected: 'Flagged before benchmarks' },
    { id: 'E27', variation: 'Waived enrollee (eligible, declined)', expected: 'Not a false healthcare fail' },
  ]},
];

export const datasetMeta = {
  status: 'DRAFT — variations pending team confirmation',
  coverage: 'Constrained to the 12 MIT-covered counties so expected outcomes are deterministic.',
  source: 'NineDean research/15-edge-case-census-spec.md · backend/scripts/gen_test_datasets.py',
};
