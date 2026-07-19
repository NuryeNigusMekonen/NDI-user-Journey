-- Correct the Test Plan for the db-replacing branch (the app now runs on Postgres).
--
-- The deployed content said "159 app + 59 pipeline = 218 tests / 30 files". That was true of the
-- pipeline-postgres-s3 branch. On db-replacing there are 166 app tests / 20 files and NO
-- backend/pipeline package at all, so the pipeline tests belong to the other line. Test counts are
-- branch-specific and the plan must say which branch it is quoting.
update public.protected_content
set payload = jsonb_set(
      jsonb_set(payload, '{testLevels}', (
        select jsonb_agg(
          case
            when lvl->>'level' = 'Unit'
              then jsonb_set(lvl, '{status}', '"exists · 166 app tests (db-replacing)"')
            when lvl->>'level' = 'Pipeline (code)'
              then jsonb_set(lvl, '{status}', '"not on db-replacing · 59 tests on pipeline-postgres-s3"')
            else lvl
          end)
        from jsonb_array_elements(payload->'testLevels') lvl)),
      '{testMeta,note}', to_jsonb(
        'Test counts are branch-specific: db-replacing has 166 app tests / 20 files and no backend/pipeline package; pipeline-postgres-s3 has 159 app + 59 pipeline tests / 30 files. The app store is Postgres (app/pii schemas); the reference warehouse is public.ext_* in the same database, owned by DE. E2E is design-only.'::text)),
    updated_at = now()
where key = 'test_plan';
