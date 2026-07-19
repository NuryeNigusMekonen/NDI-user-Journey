-- Add PROVENANCE to the reference-source coverage list.
--
-- The view said "9 of 11 sources exercised" and gave evidence, but never said WHERE each source's
-- data comes from — so a reviewer could not trace a number back to its origin. Every field below
-- was read from the live warehouse (table names, row counts, source_vintage).
update public.protected_content
set payload = jsonb_set(payload, '{sourceCoverage}', jsonb_build_array(
  jsonb_build_object('source','EPI · Family Budget Calculator','evidence','1,369 basket components won','status','strong',
    'table','ext_epi_cost + ext_epi_county','rows','502,880 + 3,143','vintage','epi:2026','feeds','Engine A basket (food, childcare, medical, housing, other)'),
  jsonb_build_object('source','CNT · H+T Affordability Index','evidence','300 — transport override on every row','status','strong',
    'table','ext_cnt','rows','3,144','vintage','cnt:2022','feeds','Engine A transportation (override, not MAX)'),
  jsonb_build_object('source','ACS · B25064 median gross rent','evidence','109 basket components won','status','good',
    'table','ext_acs','rows','3,222','vintage','acs:5y2023-B25064','feeds','Engine A housing candidate'),
  jsonb_build_object('source','O*NET · SOC occupations','evidence','300/300 resolved · 230 occupations','status','strong',
    'table','ext_onet_soc_occupation + ext_onet_soc_alt_title','rows','1,016 + 55,119','vintage','O*NET 29.0','feeds','job-title → SOC matching'),
  jsonb_build_object('source','BLS OEWS · state wages','evidence','280/300 prevailing wage · real percentiles','status','strong',
    'table','ext_bls_oews_state_wage','rows','35,427','vintage','May 2024','feeds','prevailing-wage overlay (p10/p25/median by state+SOC)'),
  jsonb_build_object('source','Census · ZCTA↔county crosswalk','evidence','real ZIPs · split-ZIP flags firing','status','strong',
    'table','ext_census_zcta_county + ext_census_county','rows','23,355 + 3,222','vintage','census_zcta:2020 · county:2024','feeds','residence ZIP → county resolution'),
  jsonb_build_object('source','A Better Balance · PSL statutes','evidence','16 PSL jurisdictions','status','good',
    'table','ext_abb_psl_law','rows','42','vintage','abb:2026','feeds','Engine B floors (cap / preempted / no-cap)'),
  jsonb_build_object('source','PolicyEngine US','evidence','tax gross-up on all 300 rows','status','strong',
    'table','in-process library (not a warehouse table)','rows','—','vintage','policyengine-us 1.745.0','feeds','Engine A federal + state + payroll + local tax'),
  jsonb_build_object('source','KFF · EHBS benchmarks','evidence','small + large firm-size bands','status','good',
    'table','ext_kff_ehbs_health_benchmarks','rows','3','vintage','kff_ehbs:2025','feeds','Engine C employer-contribution thresholds'),
  jsonb_build_object('source','MIT · Living Wage Calculator','evidence','34 components — app store has MIT for only 12 counties','status','thin',
    'table','ext_mit_expense / living_wage / financial_summary / typical_wage','rows','301,824 / 113,184 / 113,184 / 69,168','vintage','mit:livingwage.mit.edu:2026','feeds','Engine A basket — warehouse holds 3,144 counties; the app reference store has 12'),
  jsonb_build_object('source','Peterson-KFF · OOP cost-sharing','evidence','never fires — only 2 rows exist','status','blocked',
    'table','ext_peterson_kff_oop_costsharing','rows','2','vintage','live scrape; page modified 2026-02-11','feeds','Engine C out-of-pocket exposure (insufficient rows to exercise)')
)),
updated_at = now()
where key = 'dataset_catalog';
