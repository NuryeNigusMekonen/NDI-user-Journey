-- Add manual cases that verify the BUSINESS RULES, not just the application behaviour.
--
-- M-1..M-13 all test the app: can you log in, does the preview render, are flagged rows readable.
-- None checks a number against the Technical Brief. Those rules are covered by the 199 pytest
-- checks -- but an automated test asserts against the same code that produced the number, so it
-- cannot catch a plausible-but-wrong result. For a diligence tool whose whole failure mode is a
-- silently wrong number, one human tracing a figure back to its published sources is the check
-- that closes that gap.
--
-- Each case cites the brief section and the exact threshold, so a tester verifies against the
-- source of record rather than against what the screen happens to show.
--
-- M-19 is deliberately a KNOWN-GAP case: the most-favorable-state lift (brief §7.2) is not
-- implemented (research/11 row B2, target phase 6). Recording it as a case with the gap stated in
-- the expected result means a tester reports "still missing" rather than filing it as a new bug --
-- and it stops the plan implying the rule is live.

insert into public.test_manual_cases (case_id, area, title, steps, expected, priority, sort_order)
select * from (values
 ('M-14','Engine A','Fair Pay basket follows the component rules',
  '1) Run clean_baseline.xlsx 2) Open one employee''s Fair Pay detail 3) Note the county 4) Open the Reference screen and find that county''s MIT, EPI and ACS values 5) Compare each basket component',
  'Food, childcare and healthcare each equal MAX(MIT, EPI). Housing equals MAX(MIT, EPI, ACS median gross rent x 12). Transportation equals the CNT figure as an OVERRIDE, not a MAX. Civic/other/internet/mobile come from MIT alone. No weighted average anywhere (the 80/20 method was retired). Brief section 6.',
  'High',14),
 ('M-15','Engine A','Fair Pay floor = pre-tax basket + taxes',
  '1) On the same employee, note the assembled pre-tax basket 2) Note the tax figure 3) Note the published Fair Pay floor 4) Confirm the run''s frozen methodology names policyengine-us 1.745.0',
  'Floor equals pre-tax basket plus federal + state + payroll tax from PolicyEngine. The floor is never below the basket (refundable credits cannot drive it down). Local-tax states are flagged as uncaptured rather than silently understated. Brief section 6.',
  'High',15),
 ('M-16','Engine A','Split ZIP resolves to the highest-cost county',
  '1) Upload a census with a residence ZIP spanning two counties (e.g. 55906) 2) Open the employee record 3) Read the county of record and the flag',
  'The ZIP identifies the candidate counties; the engine scores against the candidate with the HIGHEST-COST Fair Pay basket, not the largest-land-area one. The pick is the county of record everywhere (basket, local tax, display, frozen snapshot) and carries a "verify" flag. An exact cost tie keeps the largest-land-area county.',
  'High',16),
 ('M-17','Engine B','PSL cost scope and proration',
  '1) Run edge_psl.xlsx 2) Check an exempt employee 3) Check a part-time employee at 1,040 hours 4) Check employees in TX and WA',
  'Exempt salaried staff generate NO incremental PSL cost (pay continues during absence). A 1,040-hour employee earns 50% of the annual entitlement, prorated against 2,080 hours. Preempted states (TX) and no-cap states (WA) both yield a floor of 0. Cost = hours below threshold x hourly rate. Brief section 7.',
  'High',17),
 ('M-18','Engine C','Healthcare benchmarks use the right thresholds',
  '1) Run edge_healthcare.xlsx 2) Note the firm size 3) Check the employer-contribution verdict per plan 4) Check the OOP layers',
  'Employer contribution: single >= 84% for every firm size; family >= 65% for small (3-199) and >= 75% for large (200+). Layer A: employee premium + average cost-sharing <= 6.2% of household income. Layer B: max deductible + premium + incremental OOP <= 9.6% on at least one plan. Family-tier household income is 1.53x the worker wage, single-tier 1.0x. Healthcare returns pass/fail only, never a remediation cost. Brief section 8.',
  'High',18),
 ('M-19','Engine B','KNOWN GAP - most-favorable-state lift is not implemented',
  '1) Build or pick a census where one state with a higher statutory PSL minimum holds at least 50% of the workforce (e.g. majority in CA at 40h, remainder in preempted TX) 2) Run it 3) Read the PSL floor applied to the TX employees',
  'PER THE BRIEF (section 7.2) the CA standard should apply enterprise-wide, so TX employees should be costed at CA''s floor. THE ENGINE DOES NOT DO THIS YET (research/11 row B2, target phase 6): TX returns floor 0 and remediation is understated for a majority-concentration footprint. Expected outcome of this case is therefore FAIL - report it as "gap still open", not as a new defect. Open question for NDI: does "workforce" mean headcount or FTE, and all employees or non-exempt only?',
  'Medium',19)
) as seed(case_id, area, title, steps, expected, priority, sort_order)
where not exists (select 1 from public.test_manual_cases where case_id = 'M-14');
