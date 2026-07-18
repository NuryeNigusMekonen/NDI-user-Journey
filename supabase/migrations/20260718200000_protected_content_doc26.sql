-- Refresh protected_content to match research/26-app-test-strategy.md
-- (2026-07-18 verification pass: 218 tests/30 files, pipeline tests exist, U9 + M-12/M-13 + E2E-6).
-- Supersedes the content derived from 14-user-journey-test-plan / 15-edge-case-census-spec / 16-test-strategy.

update public.protected_content
set payload = jsonb_set(
  jsonb_set(
    payload,
    '{testMeta}',
    '{"status":"DRAFT — pending team approval","source":"NineDean research/26-app-test-strategy.md","note":"Verified 2026-07-18 against feature/pipeline-postgres-s3 on disk. Suite: 218 tests / 30 files (159 app + 59 pipeline). Frontend E2E is design-only — no Vitest/Playwright runner in the repo yet.","riskPriority":"P1 = a silently wrong number · P2 = a broken journey step · P3 = cosmetic","scopeBoundary":"Covers the app (engines, ingestion, API, UI journey) + the gaps. Reference-data correctness is owned by 24-data-validation-plan / 25-validation-runbook (77 rules, 16 sources, ingest gate + WAP approval) and is cited, never restated.","architecture":"Two stores: the app uses SQLite (nine_dean_poc.db, ninedean/db.py); the reference/monitoring pipeline uses Postgres (ninedeandb, backend/pipeline/). Postgres did not replace the app DB — backend/ninedean never imports psycopg."}'::jsonb
  ),
  '{testLevels}',
  -- `status` MUST be a canonical key the UI knows: exists | partial | gap | missing.
  -- Any qualifier goes in `detail` — never inline in `status`.
  '[
    {"level":"Unit","scope":"engine math, parsers, validation helpers","tool":"pytest","status":"exists","detail":"159 app tests"},
    {"level":"Integration","scope":"route contract, DB, A→B→C cascade","tool":"pytest + TestClient (in-process)","status":"exists"},
    {"level":"Pipeline (code)","scope":"connectors, storage, promote, run, admin API","tool":"pytest (test_pipeline_*.py)","status":"exists","detail":"59 tests"},
    {"level":"Component (frontend)","scope":"React pages in isolation","tool":"Vitest + Testing Library","status":"missing"},
    {"level":"Contract / API over the wire","scope":"endpoints via real HTTP","tool":"pytest + httpx","status":"partial","detail":"in-process only"},
    {"level":"E2E (user journey)","scope":"full browser journey U1–U8","tool":"Playwright","status":"missing"},
    {"level":"Manual / exploratory","scope":"judgment calls, report readability","tool":"human + checklist","status":"missing"},
    {"level":"UAT","scope":"deal team signs off on real deals","tool":"human (deal team)","status":"missing"},
    {"level":"Regression","scope":"golden fixture byte-identical","tool":"pytest golden","status":"exists"},
    {"level":"Non-functional","scope":"perf, authz, reproducibility, a11y","tool":"mixed","status":"missing"}
  ]'::jsonb
)
where key = 'test_plan';

-- U1–U9 (U9 = the WAP promotion gate, missed by the first draft)
update public.protected_content
set payload = jsonb_set(payload, '{userPath}',
  '[
    {"id":"U1","step":"Authenticate (fail-closed)","where":"login (authShared.jsx) / POST /api/login","note":"empty user table admits nobody"},
    {"id":"U2","step":"Upload census (verbatim preview)","where":"POST /api/preview","note":"nothing normalized yet"},
    {"id":"U3","step":"Review parsed record; flagged rows","where":"CensusReview.jsx / POST /api/census","note":"flagged rows surfaced, never silently dropped"},
    {"id":"U4","step":"Correct flagged rows","where":"POST /api/census/{id}/corrections","note":"each correction logged + re-derives"},
    {"id":"U5","step":"Run engines (A→B→C; status→final)","where":"POST /api/census/{id}/run","note":"the A→B and A→C cascade is the critical hand-off"},
    {"id":"U6","step":"Read verdict (remediation + healthcare)","where":"GET /api/runs/{id}","note":"remediation (A+B) + per-plan pass/fail"},
    {"id":"U7","step":"Export into acquisition model","where":"run view","note":"structured paste into the model"},
    {"id":"U8","step":"Share run / manage users","where":"ShareDialog.jsx, AdminUsers.jsx, Invite.jsx","note":"owner-only share; ADMIN/ADVISOR roles"},
    {"id":"U9","step":"Review & promote reference updates (admin)","where":"PipelineAdmin.jsx — the WAP gate","note":"human-gated promotion over the pipeline pending queue (25 Procedure B)"}
  ]'::jsonb)
where key = 'test_plan';

-- Manual cases: add M-12 / M-13 for the pipeline WAP gate
update public.protected_content
set payload = jsonb_set(payload, '{manualCases}',
  (payload->'manualCases') || '[
    {"id":"M-12","case":"Pipeline review queue (PipelineAdmin)","expected":"Pending updates list with validation status + drift report; a failed validation is visibly blocked from promotion"},
    {"id":"M-13","case":"Promotion is human-gated","expected":"run* never promotes; only an explicit approve does — and it is attributed to the approver (25 Procedure B)"}
  ]'::jsonb)
where key = 'test_plan'
  and not (payload->'manualCases' @> '[{"id":"M-12"}]'::jsonb);

-- E2E: add E2E-6 for the pipeline admin gate
update public.protected_content
set payload = jsonb_set(payload, '{e2eFlows}',
  (payload->'e2eFlows') || '[
    {"id":"E2E-6","flow":"Pipeline admin — view pending queue → approve/reject a staged update","covers":"U9 · WAP gate"}
  ]'::jsonb)
where key = 'test_plan'
  and not (payload->'e2eFlows' @> '[{"id":"E2E-6"}]'::jsonb);

-- Dataset catalogue: cite doc 26 + the real generated fixtures on disk
update public.protected_content
set payload = jsonb_set(payload, '{datasetMeta}',
  '{"status":"DRAFT — variations pending team confirmation","source":"NineDean research/26-app-test-strategy.md §7 · backend/scripts/gen_test_datasets.py","coverage":"8 workbooks generated into backend/fixtures/ (real 59-column ND3 header layout, so they parse exactly like a client upload), each with an .expected.csv. Covers 27 input variations (E1–E27), each traced to a verified engine behavior.","constraint":"Full baskets require the 12 MIT-covered counties; rows testing the degraded path deliberately use an uncovered county so expected outcomes stay deterministic.","note":"Reference-source correctness (are the MIT/EPI/ABB numbers themselves right?) is not tested here — that is the ingest gate + anchors in 24-data-validation-plan §3–4."}'::jsonb)
where key = 'dataset_catalog';

update public.protected_content set updated_at = now()
where key in ('test_plan','dataset_catalog');
