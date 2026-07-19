-- Update the Simulated Data view to the VERIFIED national-warehouse figures.
--
-- Context: the fixtures were previously generated from a 16-county local sample. They are now
-- drawn from the DE-owned Postgres warehouse (public.ext_*) — 3,071 counties nationally — and
-- intersected with the counties the engines can actually price. Every number below was measured
-- from a real run, not estimated.
--
-- Run in the Supabase SQL Editor (project voyawvckqitjqtfserwo).

update public.protected_content
set payload = jsonb_build_object(
  'datasetFiles', jsonb_build_array(
    jsonb_build_object('name','clean_baseline','rows',4,
      'purpose','Happy path — every engine gives a sane number','outcome','0 rejects, all engines fire'),
    jsonb_build_object('name','edge_ingestion','rows',8,
      'purpose','E1–E8: coding, E/N exempt, blank-Code, dupes, HSA','outcome','1 reject — blank-Code row flagged, not dropped'),
    jsonb_build_object('name','edge_geo','rows',3,
      'purpose','E9–E12: unresolvable ZIP, cross-border, uncovered county','outcome','1 reject; fallbacks flagged'),
    jsonb_build_object('name','edge_fairpay_tax','rows',6,
      'purpose','E13–E17: negative gross-up, tiers, waived, local tax','outcome','floor never < basket'),
    jsonb_build_object('name','edge_psl','rows',6,
      'purpose','E18–E22: preempted, no-cap, capped, part-time, exempt','outcome','correct floors per jurisdiction'),
    jsonb_build_object('name','edge_healthcare','rows',5,
      'purpose','E23–E27: employer share, HDHP, non-compliant, waived','outcome','KFF *small* band (firm size 50)'),
    jsonb_build_object('name','scale_large','rows',300,
      'purpose','National sweep — 285 counties / 45 states, real SOC + OEWS wages','outcome','0 rejects; KFF *large* band; 233/300 below floor'),
    jsonb_build_object('name','all_combined','rows',18,
      'purpose','Regression smoke — one of each concern','outcome','2 rejects (by design)')
  ),
  'edgeVariations', (select payload->'edgeVariations' from public.protected_content where key='dataset_catalog'),
  'sourceCoverage', jsonb_build_array(
    jsonb_build_object('source','EPI',           'evidence','1,369 basket components won',              'status','strong'),
    jsonb_build_object('source','CNT',           'evidence','300 — transport override on every row',    'status','strong'),
    jsonb_build_object('source','ACS',           'evidence','109 basket components won',                'status','good'),
    jsonb_build_object('source','O*NET / SOC',   'evidence','300/300 resolved · 230 occupations',       'status','strong'),
    jsonb_build_object('source','BLS OEWS',      'evidence','280/300 prevailing wage · real percentiles','status','strong'),
    jsonb_build_object('source','Census ZCTA',   'evidence','real ZIPs · split-ZIP flags firing',        'status','strong'),
    jsonb_build_object('source','A Better Balance','evidence','16 PSL jurisdictions',                    'status','good'),
    jsonb_build_object('source','PolicyEngine',  'evidence','tax gross-up on all 300 rows',             'status','strong'),
    jsonb_build_object('source','KFF',           'evidence','small + large firm-size bands',            'status','good'),
    jsonb_build_object('source','MIT',           'evidence','34 components — app store has MIT for only 12 counties (warehouse has 3,144)','status','thin'),
    jsonb_build_object('source','Peterson-KFF',  'evidence','never fires — only 2 rows exist in the warehouse','status','blocked')
  ),
  'datasetMeta', jsonb_build_object(
    'status','Generated from the national warehouse — 9 of 11 sources exercised',
    'coverage','300-employee sweep across 285 counties / 45 states. Counties are drawn from the warehouse (3,071) and intersected with those the engines can price (302 in the app reference store); MIT-backed counties are sampled first.',
    'source','backend/scripts/gen_test_datasets.py + scripts/warehouse_ref.py · 351 rows across 8 datasets',
    'blocked','MIT is loaded for only 12 counties in the app reference store, and Peterson-KFF has 2 rows in the warehouse — both are data-loading gaps for DE, not fixture gaps.'
  )
),
updated_at = now()
where key = 'dataset_catalog';
