-- M-25: does the platform handle a census that supplies no SOC codes?
--
-- census-structure.md defines soc_code as "derived from title if blank", and E28 proved the happy
-- path works (a clean O*NET title resolves). But a real acquisition target does not write O*NET
-- titles - it writes "Chief Happiness Ninja", or "Manager", or leaves the title blank too, or
-- supplies a code that contradicts the role.
--
-- match_soc takes a different branch for each, and none was covered:
--   exact title            -> confidence 1.0
--   empty title            -> SocMatch(None, ..., "empty")
--   nothing above threshold-> soc=None, routed to review
--   near-tie               -> rival_soc set, "flagged, not silently forced onto one occupation"
--   census supplies a code -> that code wins, cross-checked via soc_title_agrees
--
-- This matters to the number: SOC selects the BLS prevailing wage an employee is compared against,
-- so a wrong or invented match puts them on the wrong occupation's pay scale.

insert into public.test_manual_cases (case_id, area, title, steps, expected, priority, sort_order)
select * from (values
 ('M-25','Upload','SOC is derived from the title, or honestly left unmatched',
  '1) Upload edge_ingestion.xlsx 2) Open the Workforce tab 3) Compare rows ING-E28 through ING-E32 4) Open each derivation and read the SOC block',
  'ING-E28 (title Sales Managers, no code) resolves to 11-2022 with an exact match. ING-E29 (no title AND no code) has nothing to derive from and is marked unmatched, flagged - never given a placeholder code. ING-E30 (invented title Chief Happiness Ninja) finds no match above threshold and is routed to review rather than forced onto the nearest occupation. ING-E31 (bare title Manager) is ambiguous: a rival occupation is surfaced with its confidence so a reviewer can choose. ING-E32 supplies 11-2022 against the title Registered Nurses - the census code WINS, but the disagreement with the title is flagged. In every case the source of the code is visible (from census / derived / unmatched).',
  'High',25)
) as seed(case_id, area, title, steps, expected, priority, sort_order)
where not exists (select 1 from public.test_manual_cases where case_id = 'M-25');
