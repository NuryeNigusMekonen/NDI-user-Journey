-- Correct the Test Plan against the db-replacing code. Four fixes:
--
-- 1. Duplicated status text. The view renders "{status} · {detail}"; a previous migration wrote the
--    whole sentence into `status` without clearing `detail`, producing
--    "exists · 166 app tests (db-replacing) · 159 app tests". Split them properly.
-- 2. Component (frontend) was "missing" — db-replacing HAS Vitest + Testing Library with 30 tests
--    across 4 files in frontend/src/__tests__/.
-- 3. E2E was "missing" and is still correct (no Playwright), but the frontend `test` script now
--    exists, so the note is clarified: unit/component tests run, browser E2E does not.
-- 4. U9 named PipelineAdmin.jsx, which does not exist on this branch. The admin surfaces here are
--    ReferenceData.jsx (the rulers the engines read) and AdminMethodologies.jsx.
update public.protected_content
set payload = jsonb_set(payload, '{testLevels}', (
      select jsonb_agg(
        case
          when lvl->>'level' = 'Unit' then
            jsonb_set(jsonb_set(lvl, '{status}', '"exists"'),
                      '{detail}', '"166 app tests (db-replacing)"')
          when lvl->>'level' = 'Pipeline (code)' then
            jsonb_set(jsonb_set(lvl, '{status}', '"missing"'),
                      '{detail}', '"not on db-replacing — 59 tests on pipeline-postgres-s3"')
          when lvl->>'level' = 'Component (frontend)' then
            jsonb_set(jsonb_set(lvl, '{status}', '"exists"'),
                      '{detail}', '"30 tests across 4 files (Vitest + Testing Library)"')
          when lvl->>'level' = 'E2E (user journey)' then
            jsonb_set(jsonb_set(lvl, '{status}', '"missing"'),
                      '{detail}', '"no browser E2E — Playwright not installed"')
          else lvl
        end)
      from jsonb_array_elements(payload->'testLevels') lvl)),
    updated_at = now()
where key = 'test_plan';

-- U9: point at the admin pages that actually exist on this branch.
update public.protected_content
set payload = jsonb_set(payload, '{userPath}', (
      select jsonb_agg(
        case when step->>'id' = 'U9' then
          jsonb_set(jsonb_set(step,
            '{where}', '"ReferenceData.jsx / AdminMethodologies.jsx"'),
            '{note}', '"reference rulers + methodology admin (PipelineAdmin lives on the pipeline branch)"')
        else step end)
      from jsonb_array_elements(payload->'userPath') step)),
    updated_at = now()
where key = 'test_plan';
