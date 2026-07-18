// NDI — Nine Dean Institute · Quality of Jobs Platform
// Journey map of the V1 MVP: census upload → three-engine cascade → export.
// Source: "Nine Dean MVP — Technical Brief" (2026.06.11), Arclio / Tenacious.

export const participants = {
  deal: {
    id: 'deal',
    label: 'NDI Deal Team',
    short: 'Deal Team',
    description: 'Authenticated NDI users who upload a target census and consume the outputs',
    color: 'sky',
  },
  platform: {
    id: 'platform',
    label: 'Platform',
    short: 'Platform',
    description: 'The single-tenant, multi-user app: authenticated upload, orchestration, export',
    color: 'brand',
  },
  fairpay: {
    id: 'fairpay',
    label: 'Fair Pay Engine (A)',
    short: 'Fair Pay (A)',
    description: 'Foundation engine — per-employee Fair Pay remediation cost; feeds B and C',
    color: 'teal',
  },
  psl: {
    id: 'psl',
    label: 'PSL Engine (B)',
    short: 'PSL (B)',
    description: 'Paid Sick Leave cost to NDI’s floor — pure calculation, depends on A',
    color: 'amber',
  },
  health: {
    id: 'health',
    label: 'Healthcare Engine (C)',
    short: 'Healthcare (C)',
    description: 'Affordability pass/fail per plan — highest engineering risk (doc parsing)',
    color: 'slate',
  },
  monitor: {
    id: 'monitor',
    label: 'Source-Monitoring Agent',
    short: 'Source Monitor',
    description: 'Claude-powered watcher for wage/healthcare data & methodology updates',
    color: 'brand',
  },
  sources: {
    id: 'sources',
    label: 'External Data Sources',
    short: 'Data Sources',
    description: 'MIT, EPI, ACS, CNT, PolicyEngine, BLS OEWS, ABB, KFF, Peterson-KFF',
    color: 'slate',
  },
  model: {
    id: 'model',
    label: 'NDI Financial Model',
    short: 'Financial Model',
    description: 'The acquisition model the platform exports remediation cost + pass/fail into',
    color: 'sky',
  },
};

export const stages = ['Upload & Normalize', 'Fair Pay (A)', 'PSL (B) + Healthcare (C)', 'Output & Export'];

export function step(from, to, text, dashed) {
  return { type: 'step', from, to, text, dashed: !!dashed };
}
export function note(text, anchor) {
  return { type: 'note', text, anchor: anchor || null };
}
export function alt(...branches) {
  return { type: 'alt', branches };
}
export function branch(label, isElse, ...steps) {
  return { label, else: !!isElse, steps };
}

export const journeys = [
  {
    id: 'census-upload-normalization',
    stage: 0,
    parallel: false,
    title: 'Census Upload & Normalization',
    tagline: 'Standardized template in → one clean per-employee record out.',
    items: [
      note('Journey 1 – Census Upload & Ingestion\nData contract: Rebecca’s May 2026 template — Employee Info, Wage Detail (4-yr history), Healthcare Detail, Paid Time Off.'),
      step('deal', 'platform', 'Authenticate (NDI user) and upload a deal’s census', false),
      step('platform', 'platform', 'Validate against the standardized template (hardened for production ingestion)', false),
      alt(
        branch(
          'Template valid',
          false,
          step('platform', 'platform', 'Parse into a clean per-employee record', false)
        ),
        branch(
          'Off-template / piecemeal files (multiple HRIS shapes)',
          true,
          step('platform', 'deal', 'Flag normalization issues for review (NDI normalizes in 15+ places today)', false)
        )
      ),
      step('platform', 'platform', 'Reconcile comp components: base + bonus + overtime + total comp', false),
      step('platform', 'platform', 'Attach 4-year comp history per employee', false),
      note('Incomplete-data handling: V1 must run on incomplete inputs.\nMissing required field → fall back to NDI-provided default (e.g., home-office location for a missing residence zip). NDI owns the defaults.', 'platform'),
      alt(
        branch(
          'Missing residence zip',
          false,
          step('platform', 'platform', 'Apply NDI default (company home-office location)', false)
        )
      ),
      step('platform', 'platform', 'Encrypt at rest; log run start (timestamp, methodology version)', false),
      step('platform', 'fairpay', 'Hand clean per-employee dataset to Fair Pay Engine (A runs first)', true),
    ],
  },
  {
    id: 'fair-pay-engine-a',
    stage: 1,
    parallel: false,
    title: 'Workstream A — Fair Pay Engine',
    tagline: 'Raw census → per-employee Fair Pay remediation cost. The foundation.',
    items: [
      note('Journey 2 – Fair Pay Engine (A)\nInputs per employee: ID; hourly + OT + bonus + total comp; exempt/non-exempt; FT/PT/temp; residence zip; work state; SOC code; age; 4-yr comp history.'),
      step('fairpay', 'fairpay', 'Ingestion & normalization — clean per-employee record; reconcile comp components', false),
      step('fairpay', 'fairpay', 'Geocoding — map each residence zip to a county', false),
      alt(
        branch(
          'Border / remote / multi-location case',
          false,
          step('fairpay', 'fairpay', 'Resolve county assignment per NDI rules', false)
        )
      ),
      note('Component-level basket construction (per county) — the analytical core.\nDeterministic MAX across MIT & EPI, with ACS (housing) and CNT (transportation) overrides. NO weighting — configurable source weights were retired.', 'fairpay'),
      step('fairpay', 'sources', 'Pull cost-of-living components per county', true),
      step('sources', 'fairpay', 'Food = MAX(MIT, EPI) — EPI typically wins via Map the Meal Gap', true),
      step('sources', 'fairpay', 'Housing = MAX(MIT, EPI, ACS B25064 median gross rent ×12)', true),
      step('sources', 'fairpay', 'Childcare = MAX(MIT, EPI); Healthcare = MAX(MIT, EPI) — both anchor MEPS-IC', true),
      step('sources', 'fairpay', 'Transportation = CNT H+T Index regionalized figure (override, not MAX)', true),
      step('sources', 'fairpay', 'Civic / other necessities / internet-mobile = MIT direct', true),
      step('fairpay', 'sources', 'Tax microsimulation — run pre-tax basket through PolicyEngine US (federal + state + payroll)', true),
      note('Binding Fair Pay floor = pre-tax basket + taxes.', 'fairpay'),
      step('fairpay', 'sources', 'Prevailing-wage overlay — BLS OEWS cross-check (confirm exact role in discovery)', true),
      step('fairpay', 'fairpay', 'Gap analysis — per-employee gap to the floor (non-exempt scope, per NDI direction)', false),
      step('fairpay', 'fairpay', 'Total workforce remediation cost + staged-uplift timeline modeling', false),
      step('fairpay', 'model', 'Output: presentation-grade analysis (Nine Tenets template) + structured paste into acquisition model', false),
      note('Cascade hand-off: A’s wage-adjusted comp feeds B and C so downstream costs accumulate correctly once wages are raised to clear the floor. Make the A→B/C hand-off explicit and tested; version intermediate outputs.', 'fairpay'),
      step('fairpay', 'psl', 'Hand wage-adjusted comp to PSL Engine (B)', true),
      step('fairpay', 'health', 'Hand wage-adjusted comp to Healthcare Engine (C)', true),
    ],
  },
  {
    id: 'psl-engine-b',
    stage: 2,
    parallel: false,
    title: 'Workstream B — Paid Sick Leave Engine',
    tagline: 'Cost to bring a target up to NDI’s PSL floor. Depends on A.',
    items: [
      note('Journey 3 – PSL Engine (B)\nPure-calculation engine (no document parsing). Consumes A’s wage-adjusted comp.'),
      step('fairpay', 'psl', 'Receive A’s wage-adjusted comp', true),
      step('psl', 'sources', 'Compliance pre-check vs federal / state / local PSL law (15+ states + DC + municipalities)', true),
      note('A Better Balance is the source of record for state-by-state PSL law.', 'sources'),
      step('psl', 'psl', 'Compute most-favorable-state lift', false),
      alt(
        branch(
          'A higher-minimum state holds ≥50% of the operating company’s workforce',
          false,
          step('psl', 'psl', 'Apply that state’s standard enterprise-wide (majority-concentration footprint, not a satellite presence)', false)
        ),
        branch(
          'No majority-concentration footprint',
          true,
          step('psl', 'psl', 'Use default baseline only', false)
        )
      ),
      step('psl', 'psl', 'Tenet calculation — default 40-hour / 5-day baseline for all eligible employees', false),
      note('Cost scope — non-exempt only.\nExempt salaried workers generate no incremental PSL cost (pay continues during absence by design).', 'psl'),
      step('psl', 'psl', 'Non-exempt cost = (hours below threshold) × (hourly rate + replacement-coverage rate where applicable)', false),
      alt(
        branch(
          'Fixed-term / project worker',
          false,
          step('psl', 'psl', 'Prorate entitlement against 2,080-hour year (1,040 hrs → 50% of annual entitlement)', false)
        )
      ),
      step('psl', 'model', 'Output: PSL remediation cost (accumulated on A’s raised wages) into acquisition model', false),
    ],
  },
  {
    id: 'healthcare-engine-c',
    stage: 2,
    parallel: true,
    title: 'Workstream C — Affordable Healthcare Engine',
    tagline: 'Pass/fail per plan — not a remediation cost. Highest engineering risk.',
    items: [
      note('Journey 4 – Healthcare Engine (C)\nBuilt once A is stable; consumes A’s wage-adjusted outputs. Highest engineering risk — benefits-document parsing — isolate and benchmark early.'),
      step('fairpay', 'health', 'Receive A’s wage-adjusted comp', true),
      step('health', 'health', 'Benefits document parsing — summaries, plan docs, census benefits section', false),
      note('Extract: premium split (EE/ER), deductibles, coinsurance, OOP maximums, plan tiers, HSA/FSA contributions, HDHP designation.\nAccuracy bar: ≥95% across ≥3 carriers — a hard acceptance criterion.', 'health'),
      step('health', 'health', 'ACA compliance pre-check — flag grandfathered / non-compliant plans', false),
      alt(
        branch(
          'Plan grandfathered or non-compliant',
          false,
          step('health', 'deal', 'Flag before applying NDI benchmarks', false)
        ),
        branch(
          'Compliant',
          true,
          step('health', 'health', 'Confirm minimum essential coverage + IRS affordability test (9.02% 2025 / 9.96% 2026)', false)
        )
      ),
      note('Benchmark 1 — employer premium contribution (firm-size split).\nSmall (3–199): single ≥84%, family ≥65%. Large (200+): single ≥84%, family ≥75%. The 200-employee break follows the KFF Employer Health Benefits Survey convention.', 'health'),
      step('health', 'health', 'Benchmark 1 — evaluate employer premium contribution vs firm-size thresholds', false),
      note('Benchmark 2 — OOP affordability, two layers.\nLayer A (average year): premium + est. cost-sharing ≤ 6.2% of household income (Peterson-KFF).\nLayer B (bad year): max deductible + premium + avg incremental OOP ≤ 9.6% on ≥1 offered plan.', 'health'),
      step('health', 'health', 'Benchmark 2A — average-year OOP ≤ 6.2% of household income', false),
      step('health', 'health', 'Benchmark 2B — bad-year exposure ≤ 9.6% on at least one offered plan', false),
      alt(
        branch(
          'HDHP is the only plan offered',
          false,
          step('health', 'health', 'Layer B may fail — genuine exposure', false)
        ),
        branch(
          'Standard plan offered alongside HDHP',
          true,
          step('health', 'health', 'HDHP choice = preference, not exposure — do not fail Layer B on it', false)
        )
      ),
      note('Household income (1.53× multiplier).\nSingle-tier: 1.0×. Family-tier default: 1.53× worker’s wage. Conservative sensitivity: 1.0× stress test for lower-wage workforces. Gender refinement where census exposes it.', 'health'),
      note('Family-status caveat: hardest input to obtain. V1 uses healthcare enrollment + tier election as the primary signal, falling back to default multipliers (1.0× single / 1.53× family).', 'health'),
      step('health', 'model', 'Output: pass/fail on Benchmarks 1 + 2A + 2B per plan (no clean remediation number)', false),
      note('Plan-design changes and their cost are surfaced for the post-acquisition Lockton review, not the diligence model.', 'health'),
    ],
  },
  {
    id: 'output-assembly-export',
    stage: 3,
    parallel: false,
    title: 'Output Assembly & Export',
    tagline: 'Remediation cost + healthcare pass/fail → NDI’s acquisition model.',
    items: [
      note('Journey 5 – Output Assembly & Export'),
      step('fairpay', 'platform', 'Fair Pay remediation cost', true),
      step('psl', 'platform', 'PSL remediation cost', true),
      step('health', 'platform', 'Healthcare pass/fail per plan', true),
      step('platform', 'platform', 'Assemble outputs — total remediation cost (Fair Pay + PSL) + healthcare pass/fail', false),
      step('platform', 'model', 'Structured export into NDI’s acquisition financial model', false),
      alt(
        branch(
          'Deal still pencils',
          false,
          step('deal', 'deal', 'Proceed with acquisition', false)
        ),
        branch(
          'Remediation cost breaks the model',
          true,
          step('deal', 'deal', 'Re-evaluate or pass on the target', false)
        )
      ),
      note('Same-day output replaces a multi-week manual analysis per deal.', 'platform'),
    ],
  },
  {
    id: 'source-monitoring-audit',
    stage: 3,
    parallel: true,
    title: 'Reference Pipeline & Audit Trail',
    tagline: 'Cross-cutting — validated source updates, human-gated promotion, reproducibility.',
    items: [
      note('Journey 6 – Reference-data pipeline & audit trail (parallel)\nBUILT: a Postgres reference store (ninedeandb) with a validate → stage → human-approve → promote flow.\nSeparate from the app’s operational store — the engines never read staged data.'),
      step('monitor', 'monitor', 'Scheduled poll (run-due) — sources past their cadence, circuit-breaker aware', false),
      step('monitor', 'sources', 'Cheap freshness signal; skip when unchanged', true),
      step('sources', 'monitor', 'Fetch payload → content fingerprint (SHA); identical ⇒ NO_CHANGE, stop (idempotent)', true),
      note('16 reference sources: MIT, EPI, ACS, CNT, BLS/OEWS, O*NET, Census (county + ZCTA), A Better Balance, KFF, Peterson-KFF …', 'monitor'),
      step('monitor', 'monitor', 'Normalize → VALIDATE (the ingest gate) → stage into staging_ext_* + a pending_update', false),
      note('The gate: 77 rules across 16 sources (row_count · regex · range · no_sentinel · unique · foreign_key · spot_check).\nerror ⇒ promotion BLOCKED; warn ⇒ recorded in the drift report and surfaced at review. Fail loud, never silent.', 'monitor'),
      step('monitor', 'deal', 'Queue for human review — validation status + drift report + diff summary', false),
      alt(
        branch(
          'Reviewer approves (the WAP gate)',
          false,
          step('deal', 'platform', 'Promote staged rows live; bump the methodology version; record the approver', false)
        ),
        branch(
          'Reviewer rejects or holds',
          true,
          step('platform', 'platform', 'Drop staging (dead-letter) or defer; the current methodology version stands', false)
        )
      ),
      note('Nothing promotes itself — a scheduled run never promotes. Promotion is always a person approving in the admin queue.', 'platform'),
      note('Methodology versioning — thresholds, multipliers (e.g., 1.53×), and source choices are versioned.\nEvery analysis records the version it ran against, so a Q3 2026 assessment stays reproducible on Q3 2026 methodology.', 'platform'),
      step('platform', 'platform', 'Audit trail — timestamp & log inputs, source values, thresholds, methodology version, outputs', false),
      note('So a deal team can answer “why did the model say X?” months later. Census files older than the active diligence period are purged unless NDI specifies retention.', 'platform'),
    ],
  },
];
