-- Re-baseline the Test Plan on version1 — the branch staging actually runs.
--
-- The plan described db-replacing (166 app tests / 20 files). Validating the journey against
-- stage-ninedean.gettenacious.com showed staging runs version1, which merged db-replacing AND the
-- whole reference-data pipeline: 239 tests across 32 files, plus /api/pipeline/* routes that are
-- live (they answer 401 to an anonymous caller).
--
-- Counts read from the branch, not estimated:
--   backend   239 tests / 32 files   (12 of those files are pipeline-only)
--   frontend   30 tests /  4 files   (api 5, dashcards 5, format 11, workforce 9)
--
-- This matters because the plan is the artefact shared with the client: citing a test suite the
-- deployed product does not have is the same class of error as a wrong remediation number.

update public.protected_content
set payload = jsonb_set(
      jsonb_set(
        payload,
        '{testLevels}',
        (
          select jsonb_agg(
            case
              when lvl->>'level' = 'Unit' then jsonb_set(
                jsonb_set(lvl, '{status}', '"exists"'),
                '{detail}', '"239 backend tests / 32 files (version1)"')
              when lvl->>'level' = 'Integration' then jsonb_set(
                jsonb_set(lvl, '{status}', '"exists"'),
                '{detail}', '"route contract + A→B→C cascade + pipeline promotion"')
              when lvl->>'level' = 'Data quality' then jsonb_set(
                jsonb_set(lvl, '{status}', '"exists"'),
                '{detail}', '"12 pipeline test files: connectors, validation, promote, storage"')
              when lvl->>'level' like 'Regression%' then jsonb_set(
                jsonb_set(lvl, '{status}', '"exists"'),
                '{detail}', '"golden fixture byte-identical"')
              else lvl
            end
          )
          from jsonb_array_elements(payload->'testLevels') as lvl
        )
      ),
      '{testMeta}',
      jsonb_build_object(
        'status', 'DRAFT — pending team approval · manual testing in progress on staging',
        'source', 'version1 branch · stage-ninedean.gettenacious.com',
        'note',
          '239 backend tests / 32 files and 30 frontend tests / 4 files, read from version1. '
          || 'An earlier revision cited db-replacing (166 / 20), which is NOT what staging runs — '
          || 'version1 additionally carries the reference-data pipeline (fetch → S3 → stage → '
          || 'human approve/hold/reject → promote, appending an immutable methodology_version). '
          || 'E2E is design-only; manual cases and UAT run on staging.'
      )
    ),
    updated_at = now()
where key = 'test_plan';
