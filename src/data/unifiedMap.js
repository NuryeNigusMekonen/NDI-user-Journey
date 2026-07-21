// One map, every path — the whole Nine Dean platform as a single graph.
//
// The six separate journeys answer "how does this stage work". This answers "what happens to a
// census, end to end, including when it goes wrong". The green spine is the happy path; branches
// fork where reality intervenes, run their course, and merge back.
//
// Baselined against the `version1` branch — what stage-ninedean.gettenacious.com actually runs.
// An earlier revision documented `db-replacing`, which omitted the whole reference-data pipeline
// and cited 166 tests where version1 has 239.
//
// Every `tests` count and file name below is REAL — read from backend/tests/ on version1, not
// illustrative. A node that claims proof it does not have is the same failure as a wrong number.

export const LANES = [
  { id: 'refdata', label: 'REFERENCE DATA (DE)' },
  { id: 'upload', label: 'UPLOAD & VALIDATION' },
  { id: 'prep', label: 'DATA PRE-PROCESSING' },
  { id: 'engines', label: 'ENGINES' },
  { id: 'outputs', label: 'OUTPUTS' },
];

export const PATHS = {
  ALL: 'all',
  HAPPY: 'happy',
  MESSY: 'messy',
  GEO: 'geo',
  REFDATA: 'refdata',
};

export const PATH_FILTERS = [
  { id: PATHS.ALL, label: 'All paths' },
  { id: PATHS.HAPPY, label: 'Happy path' },
  { id: PATHS.MESSY, label: 'Messy census' },
  { id: PATHS.GEO, label: 'Unresolvable location' },
  { id: PATHS.REFDATA, label: 'Reference-data refresh' },
];

// kind: spine (green happy path) | branch (reality intervenes) | merge-back into the spine
export const NODES = [
  {
    id: 'fetch', col: 0, cy: 0, lane: 'refdata', kind: 'spine', row: 0,
    title: 'Fetch external sources', sub: 'scheduled · raw file to S3',
    paths: [PATHS.REFDATA],
    what: 'A timer runs the connectors against the eleven public sources — MIT, EPI, ACS, CNT, BLS '
      + 'OEWS, O*NET, Census, A Better Balance, KFF, Peterson-KFF. Each fetch writes the RAW file to '
      + 'S3 for provenance and records the attempt in fetch_log, so a value can always be traced '
      + 'back to the document it came from and the day it was retrieved.',
    behavior: [
      'Sources are seeded from source_manifest, never hardcoded in a connector',
      'The raw fetched file is archived to S3 before anything is parsed',
      'Every attempt lands in fetch_log — a failed fetch is visible, not silent',
    ],
    next: 'Validate & stage',
    tests: [
      { id: 'test_pipeline_run.py', n: 9, what: 'the scheduled run, per-source' },
      { id: 'test_pipeline_connectors_rulers.py', n: 7, what: 'KFF / ABB / Peterson connectors' },
      { id: 'test_pipeline_connectors_cost.py', n: 6, what: 'MIT / EPI / ACS / CNT cost connectors' },
      { id: 'test_pipeline_storage.py', n: 5, what: 'raw file lands in S3 with its key' },
    ],
    cases: ['TC-M12 Reference data screen'],
  },
  {
    id: 'stage-validate', col: 1, cy: 0, lane: 'refdata', kind: 'spine', row: 0,
    title: 'Validate & stage', sub: 'candidate rows held pending',
    paths: [PATHS.REFDATA],
    what: 'A fetched refresh is parsed into staging tables and validated. It does NOT touch the '
      + 'live reference tables — it becomes a pending_update awaiting a human. This is the gate '
      + 'that stops a bad upstream scrape silently moving every remediation number.',
    behavior: [
      'Candidate rows land in staging_*, never directly in production reference tables',
      'Validation failures are attached to the pending update, not swallowed',
      'The live rulers keep serving the previous approved vintage until promotion',
    ],
    next: 'Human review — approve, hold or reject',
    tests: [
      { id: 'test_validation.py', n: 12, what: 'the validation rules on candidate rows' },
      { id: 'test_pipeline_db.py', n: 7, what: 'staging tables + migrations' },
      { id: 'test_pipeline_census_and_abb.py', n: 6, what: 'census + ABB source staging' },
    ],
  },
  {
    tested: 'TC-M20, TC-M21 passed: dashboard figures reconcile with the runs beneath them; a schema-drift halt staged NOTHING. TC-M22/23/24 remain UNRUN - actioning live pipeline data needs sign-off (FF-011)',
    id: 'review-gate', col: 2, cy: 0, lane: 'refdata', kind: 'spine', row: 0,
    title: 'Human review gate', sub: 'approve · hold · reject',
    paths: [PATHS.REFDATA],
    what: 'A person reviews the pending update and decides. Approving promotes the staged rows into '
      + 'the live reference tables and appends a NEW immutable methodology_version — so a run made '
      + 'before the refresh still reproduces against the vintage it actually used.',
    behavior: [
      'APPROVE promotes staged rows and appends an immutable methodology_version',
      'HOLD leaves the pending update in place; the live rulers are unchanged',
      'REJECT discards the candidate; the raw S3 file is kept for the audit trail',
      'An older run keeps its frozen version — a promotion never rewrites history',
    ],
    next: 'Promoted rulers — consumed by Engine A, B and C',
    tests: [
      { id: 'test_pipeline_promote.py', n: 10, what: 'promote / hold / reject + version append' },
      { id: 'test_pipeline_admin_api.py', n: 2, what: 'the review endpoints and their authz' },
      { id: 'test_pipeline_health.py', n: 3, what: 'pipeline health surface' },
    ],
    cases: ['TC-M13 Methodology versioning'],
  },
  {
    tested: 'TC-M1, TC-M2 passed: fail-closed access; 300 rows x 59 columns previewed verbatim',
    id: 'upload', col: 3, cy: 0, lane: 'upload', kind: 'spine', row: 0,
    title: 'Upload census', sub: 'file in, versioned',
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'An NDI deal-team member uploads the target workforce census. The file is versioned '
      + 'against the deal and handed to validation — nothing is parsed or trusted yet. The preview '
      + 'is verbatim: every one of the 59 ND3 columns is shown exactly as written, so a reviewer '
      + 'sees the client file, not our interpretation of it.',
    behavior: [
      'File versioned against the deal; the upload is logged with user + timestamp',
      'Verbatim preview — nothing normalized, renamed or dropped at this stage',
      'Fail-closed auth: an empty user table admits nobody',
    ],
    next: 'Schema validation',
    tests: [
      { id: 'test_api.py', n: 7, what: 'route contract, auth on every deal endpoint' },
      { id: 'test_auth_users.py', n: 22, what: 'fail-closed login, invite/reset, role isolation' },
      { id: 'test_preview_raw.py', n: 2, what: 'preview returns every original column unchanged' },
    ],
    cases: ['TC-M1 Login fail-closed', 'TC-M2 Upload and verbatim preview'],
  },
  {
    tested: 'TC-M3 passed: 9 rows = 8 flagged + 1 rejected, fully accounted; the blank-Code row is rejected in plain sight, never dropped; E/N exempt coding read correctly',
    id: 'validate', col: 4, cy: 0, lane: 'upload', kind: 'spine', row: 0,
    title: 'Schema + row validation', sub: 'tiered · flag, never drop',
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'Headers are matched against the alias catalogue two-pass — exact first, then substring, '
      + 'order-sensitive so a specific signature claims its column before a looser one can steal '
      + 'it. Rows are then validated. The rule that matters: a defect is flagged and recorded in '
      + 'the fallback ledger, never silently dropped or nulled.',
    behavior: [
      'Two-pass alias matching (exact → substring), order-sensitive',
      'A row with data but a blank Code is FLAGGED and REJECTED — never dropped',
      'A fully empty padding row is skipped without a flag',
      'Duplicate Codes are disambiguated, not merged',
      'Every default and rejection lands in the fallback ledger with a reason',
    ],
    next: 'Data pre-processing — or the messy-census branch',
    tests: [
      { id: 'test_census_staged.py', n: 9, what: 'staged ingest, review status, corrections' },
      { id: 'test_census_config.py', n: 3, what: 'alias catalogue loads and is order-sensitive' },
      { id: 'test_incomplete_data.py', n: 6, what: 'conservative defaults, each one flagged' },
    ],
    cases: ['TC-M3 Flagged rows are visible and readable'],
    edges: ['E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'],
  },
  {
    id: 'flag', col: 3, cy: 1, lane: 'upload', kind: 'branch', row: 1,
    title: 'Flag & surface defects', sub: 'issues shown for edit',
    paths: [PATHS.MESSY],
    what: 'Record-level defects are surfaced to the reviewer with a reason a non-engineer can act '
      + 'on. This is the branch a real client census almost always takes — the bundled sample is '
      + 'clean, which is exactly why it hides bugs.',
    behavior: [
      'Each flagged row carries a human-readable reason, not an error code',
      'Rejected rows are listed, so nothing disappears between upload and run',
    ],
    next: 'Edit & re-validate',
    tests: [{ id: 'test_census_staged.py', n: 9, what: 'flagged rows surface with reasons' }],
    cases: ['TC-M3 Flagged rows are visible and readable'],
  },
  {
    id: 'edit', col: 4, cy: 1, lane: 'upload', kind: 'branch', row: 1, loop: true,
    title: 'Edit & re-validate', sub: 'loop until clean',
    paths: [PATHS.MESSY],
    what: 'The reviewer corrects a flagged field and the record re-derives. The loop repeats until '
      + 'the census is clean. Status only moves review → final on a run, so a half-corrected census '
      + 'cannot be mistaken for a finished one.',
    behavior: [
      'Each correction persists and is written to the audit log',
      'The record re-derives after a correction — no stale downstream value',
      'Status moves review → final only when the run executes',
    ],
    next: 'Merges back to the spine at Data pre-processing',
    tests: [{ id: 'test_census_staged.py', n: 9, what: 'correction persists, logs, re-derives' }],
    cases: ['TC-M4 Correction flow'],
  },
  {
    tested: 'TC-M16 passed: an ambiguous ZIP resolved to the HIGHEST-COST candidate county (40% land area chosen over 60%). TC-M7 could NOT be run - no reachable ZIP currently degrades (FF-008)',
    id: 'prep', col: 5, cy: 0, lane: 'prep', kind: 'spine', row: 0,
    title: 'Normalize + geocode', sub: 'ZIP → county · title → SOC',
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'Clean records are normalized. Residence ZIP resolves to a county, and job title resolves '
      + 'to a SOC code where the census did not supply one. Both are conservative: an ambiguous '
      + 'input is resolved in the direction that cannot understate remediation, and flagged.',
    behavior: [
      'Split ZIP → the candidate county with the HIGHEST-COST Fair Pay basket, flagged "verify"',
      'An exact basket-cost tie keeps the largest-land-area county',
      'A census-supplied SOC wins and is cross-checked against the title (soc_title_agrees)',
      'A blank SOC derives from the title via O*NET; a near-tied rival is surfaced, not chosen',
      'No match at all → soc_source=unmatched, never a stub',
    ],
    next: 'Engine A — Fair Pay',
    tests: [
      { id: 'test_geo.py', n: 14, what: 'ZIP → county, fallbacks, cross-border rules' },
      { id: 'test_split_zip_resolution.py', n: 7, what: 'highest-cost pick on the real 55906 crosswalk' },
      { id: 'test_soc_matching.py', n: 10, what: 'title → SOC via the O*NET alternate-title table' },
    ],
    cases: ['TC-M16 Split ZIP resolves to the highest-cost county'],
    edges: ['E9', 'E11', 'E28'],
  },
  {
    id: 'geo-fail', col: 5, cy: 1, lane: 'prep', kind: 'branch', row: 1,
    title: 'Location unresolvable', sub: 'no county can be chosen',
    paths: [PATHS.GEO],
    what: 'The ZIP does not resolve, or resolves across states inconsistently with the work state. '
      + 'Rather than guess, the platform walks a documented fallback ladder and flags what it used.',
    behavior: [
      'Missing/unresolvable ZIP → the cost-centre work-site county, then the home office',
      'Cross-border residence resolves only when state-consistent, else flagged',
      'An uncovered county yields a DEGRADED basket — never a partial number shown as complete',
    ],
    next: 'NDI review queue',
    tests: [{ id: 'test_geo.py', n: 14, what: 'each fallback rung, each one flagged' }],
    cases: ['TC-M7 Degraded run is visible'],
    edges: ['E9', 'E12'],
  },
  {
    id: 'review-queue', col: 6, cy: 1, lane: 'prep', kind: 'branch', row: 1,
    title: 'NDI review queue', sub: 'human decision, audited',
    paths: [PATHS.GEO],
    what: 'A case the rules refuse to decide goes to a person. The reviewer\'s choice is recorded '
      + 'with the run, so months later the number can be reconstructed together with the judgement '
      + 'that produced it.',
    behavior: [
      'The reviewer\'s choice is written to the audit trail with the run_id',
      'The run records that it used a reviewed value, not a derived one',
    ],
    next: 'Merges back to the spine at Engine A',
    tests: [{ id: 'test_repository.py', n: 3, what: 'audit trail persists the decision' }],
    cases: ['TC-M13 Methodology versioning'],
  },
  {
    tested: 'TC-M14, TC-M15 passed: basket rules verified across 4 counties (ACS won housing on Alameda; transportation is a CNT override, not a MAX); basket $66,375 + tax $13,747 = floor $80,122 exactly',
    id: 'engine-a', col: 6, cy: 0, lane: 'engines', kind: 'spine', row: 0,
    title: 'Engine A — Fair Pay', sub: 'basket → tax → floor → gap',
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'The foundation engine. It assembles a county-level cost basket from the public rulers, '
      + 'grosses it up for tax, and compares the result to what the employee is actually paid. '
      + 'Everything downstream consumes its wage-adjusted output.',
    behavior: [
      'Food, childcare, healthcare = MAX(MIT, EPI); housing = MAX(MIT, EPI, ACS rent × 12)',
      'Transportation = CNT as an OVERRIDE, not a MAX',
      'Civic / other / internet / mobile come from MIT alone — no weighted average anywhere',
      'Floor = pre-tax basket + federal/state/payroll tax via PolicyEngine (pinned 1.745.0)',
      'Gross-up floored at max(0,…) so refundable credits cannot push the floor below the basket',
      'Filing status and dependents derive from the SAME household the basket priced',
      'Local-tax states are flagged as uncaptured, never silently understated',
    ],
    next: 'Engines B and C, in parallel',
    tests: [
      { id: 'test_engines.py', n: 19, what: 'basket assembly, tax gross-up, floor, gap' },
      { id: 'test_reference.py', n: 32, what: 'the rulers load and are keyed correctly' },
      { id: 'test_prevailing_wage.py', n: 2, what: 'OEWS overlay by state + SOC' },
    ],
    cases: ['TC-M14 Basket component rules', 'TC-M15 Floor = basket + tax'],
    edges: ['E13', 'E14', 'E15', 'E16', 'E17'],
  },
  {
    tested: 'TC-M17 passed on the rules that ARE built: TX/WA floor 0, CA 40h, NY 56h, part-time halved, exempt out of scope - and the cascade proved, priced at A\'s raised $38.52/hr not the census $28.80/hr',
    id: 'engine-b', col: 7, cy: 0.6, lane: 'engines', kind: 'spine', row: 0,
    title: 'Engine B — Paid Sick Leave', sub: "consumes A's adjusted wages",
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'Pure calculation, no document parsing. Costs the gap between what the target grants and '
      + 'the statutory floor — at Engine A\'s RAISED wage, so the cascade accumulates correctly.',
    behavior: [
      'Floor is the A Better Balance use-cap for the work state, by employer-size band',
      'Preempted states (TX/FL/GA/WI) and no-cap states (WA) both yield a floor of 0',
      'Exempt salaried staff generate NO incremental cost — pay continues during absence',
      'Part-time entitlement prorates against a 2,080-hour year (1,040h → 50%)',
      'Cost = hours below the floor × the wage-adjusted hourly rate',
    ],
    next: 'Output B',
    tests: [
      { id: 'test_engines.py', n: 19, what: 'floors per jurisdiction, proration, scope' },
      { id: 'test_run_service.py', n: 3, what: 'A→B cascade end to end' },
    ],
    cases: ['TC-M17 PSL cost scope and proration', 'TC-M19 KNOWN GAP — state lift'],
    edges: ['E18', 'E19', 'E20', 'E21', 'E22'],
    warn: 'TWO GAPS found in manual testing (FR-018, FR-012). (1) The most-favorable-state lift '
      + '(brief §7.2) is not implemented — a state holding ≥50% of the workforce should lift its '
      + 'standard enterprise-wide, but there is no concentration logic at all. (2) 17 city and 2 '
      + 'county PSL ordinances are LOADED and shown on the Reference screen, yet the engine reads '
      + 'state rows only — Berkeley requires 48h where California requires 40h, so a Berkeley '
      + 'employee is costed at the lower figure. Both UNDERSTATE remediation.',
    verdict: 'gap',
  },
  {
    tested: 'TC-M18 mostly correct: 50% employer share fails B1 with verdict \'review\'; HDHP judged on real exposure not plan type; waived enrollee not a false fail. The ACA pre-check is the failure',
    id: 'engine-c', col: 7, cy: -0.6, lane: 'engines', kind: 'spine', row: 0,
    title: 'Engine C — Healthcare', sub: "consumes A's adjusted wages",
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'Returns pass/fail per plan, never a remediation cost — plan design is too dependent on '
      + 'cycle timing and employee choice to price cleanly in diligence. The only accuracy-critical '
      + 'LLM surface in the platform (benefits-document parsing) lives here, and is deferred.',
    behavior: [
      'ACA pre-check first: grandfathered / non-compliant plans flagged BEFORE benchmarks run',
      'Employer share: single ≥84% all sizes; family ≥65% small (3–199), ≥75% large (200+)',
      'Layer A — average year: premium + cost-sharing ≤ 6.2% of household income',
      'Layer B — bad year: max deductible + premium + incremental OOP ≤ 9.6%, on ≥1 plan',
      'HDHP fails Layer B only when it is the ONLY plan offered — otherwise it is preference',
      'Household income: family tier 1.53× the worker wage, single tier 1.0×',
      'HSA employer money is NOT counted as medical employer contribution',
    ],
    next: 'Output C',
    tests: [
      { id: 'test_engines.py', n: 19, what: 'benchmarks 1 / 2A / 2B, verdicts' },
      { id: 'test_reference.py', n: 32, what: 'KFF + Peterson thresholds load' },
    ],
    cases: ['TC-M18 Healthcare benchmarks use the right thresholds'],
    edges: ['E23', 'E24', 'E25', 'E26', 'E27'],
    warn: 'DEFECT found in manual testing (FR-010): the ACA compliance pre-check required by '
      + 'brief §8.1 is not implemented. A plan named "Grandfathered Legacy Plan" returned '
      + 'AFFORDABLE with no flag — a grandfathered plan can be legally non-compliant however '
      + 'affordable it looks. Separately, Peterson-KFF holds only 2 rows, so the bad-year OOP '
      + 'screen rests on a 2023 figure while every other ruler is 2025–26 (a DE loading gap).',
    verdict: 'gap',
  },
  {
    id: 'out-a', col: 8, cy: 0, lane: 'outputs', kind: 'spine', row: 0,
    title: 'Output A — Fair Pay', sub: 'cost + adjusted wages',
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'Per-employee remediation cost and the wage-adjusted compensation that B and C consumed.',
    behavior: [
      'Uplift = Σ gap, and cannot go negative',
      'Adjusted wages are published on the same base-pay basis the engines scored',
    ],
    next: 'NDI acquisition model',
    tests: [{ id: 'test_golden.py', n: 2, what: 'the 13-employee golden run stays byte-identical' }],
    cases: ['TC-M5 Verdict readability'],
  },
  {
    id: 'out-b', col: 8, cy: 1.2, lane: 'outputs', kind: 'spine', row: 0,
    title: 'Output B — PSL', sub: 'remediation cost',
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'The cost of lifting the target to the PSL floor, on A\'s raised wages.',
    behavior: ['Reported separately from A so the two remediation lines stay legible'],
    next: 'NDI acquisition model',
    tests: [{ id: 'test_engines.py', n: 19, what: 'PSL cost per jurisdiction' }],
    cases: ['TC-M5 Verdict readability'],
  },
  {
    id: 'out-c', col: 8, cy: -1.2, lane: 'outputs', kind: 'spine', row: 0,
    title: 'Output C — Healthcare', sub: 'pass / fail per plan',
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'A verdict per plan — affordable, review, or fail — with the benchmark that decided it.',
    behavior: [
      'Never a remediation cost; plan-design changes go to the post-acquisition Lockton review',
      'A degraded run is marked as degraded, never presented as full confidence',
    ],
    next: 'NDI acquisition model',
    tests: [{ id: 'test_engines.py', n: 19, what: 'verdict per plan' }],
    cases: ['TC-M7 Degraded run is visible'],
  },
  {
    tested: 'TC-M5, TC-M6, TC-M13 passed: A+B reconciles to the total, healthcare stays separate; the Word report carries real tables; and a live config change did NOT move a completed run ($91,878 held)',
    id: 'model', col: 9, cy: 0, lane: 'outputs', kind: 'spine', row: 0,
    title: 'NDI acquisition model', sub: 'A + B cost · C verdicts',
    paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO],
    what: 'The deliverable. Total remediation (A + B) plus the healthcare verdicts, exported into '
      + 'the acquisition model. One run_id threads the whole chain, so any number can be '
      + 'reconstructed months later against the exact methodology version that produced it.',
    behavior: [
      'Total remediation = A + B; healthcare stays a separate pass/fail',
      'run_id threads census snapshot → source_value_log → engine results → frozen params',
      'The methodology version is immutable and snapshotted into every run',
      'Same census + same methodology version → the same number, forever',
    ],
    next: 'End of the journey',
    tests: [
      { id: 'test_golden.py', n: 2, what: 'reproducibility — the golden fixture is the contract' },
      { id: 'test_methodology.py', n: 5, what: 'version freeze + conservative defaults' },
      { id: 'test_admin_methodologies.py', n: 5, what: 'a new version is frozen, never overwritten' },
    ],
    cases: ['TC-M6 Export into the acquisition model', 'TC-M13 Methodology versioning'],
  },
];

// from → to, with the label shown on the connector. `back: true` draws a loop.
export const LINKS = [
  { from: 'fetch', to: 'stage-validate', paths: [PATHS.REFDATA] },
  { from: 'stage-validate', to: 'review-gate', paths: [PATHS.REFDATA] },
  { from: 'review-gate', to: 'stage-validate', label: 'hold → re-validate', back: true, paths: [PATHS.REFDATA] },
  { from: 'review-gate', to: 'engine-a', label: 'approved rulers', merge: true, paths: [PATHS.REFDATA] },
  { from: 'upload', to: 'validate', paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO] },
  { from: 'upload', to: 'upload', label: 'wrong document → re-upload', back: true, paths: [PATHS.MESSY] },
  { from: 'validate', to: 'prep', label: 'clean records', paths: [PATHS.HAPPY] },
  { from: 'validate', to: 'flag', label: 'record-level defects', paths: [PATHS.MESSY] },
  { from: 'flag', to: 'edit', paths: [PATHS.MESSY] },
  { from: 'edit', to: 'flag', label: 'issues found → edit', back: true, paths: [PATHS.MESSY] },
  { from: 'edit', to: 'prep', label: 'clean records merge', merge: true, paths: [PATHS.MESSY] },
  { from: 'prep', to: 'engine-a', paths: [PATHS.HAPPY, PATHS.MESSY] },
  { from: 'prep', to: 'geo-fail', label: 'unresolvable ZIP', paths: [PATHS.GEO] },
  { from: 'geo-fail', to: 'review-queue', paths: [PATHS.GEO] },
  { from: 'review-queue', to: 'engine-a', label: 'resolved, audited', merge: true, paths: [PATHS.GEO] },
  { from: 'engine-a', to: 'engine-b', label: "A's wages", paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO] },
  { from: 'engine-a', to: 'engine-c', label: "A's wages", paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO] },
  { from: 'engine-a', to: 'out-a', paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO] },
  { from: 'engine-b', to: 'out-b', paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO] },
  { from: 'engine-c', to: 'out-c', paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO] },
  { from: 'out-a', to: 'model', paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO] },
  { from: 'out-b', to: 'model', paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO] },
  { from: 'out-c', to: 'model', paths: [PATHS.HAPPY, PATHS.MESSY, PATHS.GEO] },
];
