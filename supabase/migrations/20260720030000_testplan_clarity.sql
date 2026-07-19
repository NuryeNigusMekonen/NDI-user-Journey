-- Make the Test Plan readable to someone who has not lived in this codebase, and correct three
-- items that describe the pipeline branch rather than db-replacing.
--
-- Problems:
--  1. No framing. The page opened on a ten-row table of jargon with no explanation of why there are
--     ten levels, what "in-process" means, or that the plan deliberately splits machine-checkable
--     from human-judgement work.
--  2. T-* and E# codes were unexplained, and nothing linked E# back to the Simulated Data view.
--  3. M-12, M-13 and E2E-6 describe PipelineAdmin and a promotion queue. Neither exists here —
--     there is no backend/pipeline package and no PipelineAdmin page on this branch.

-- 1 + 2: section intros the view renders above each block.
update public.protected_content
set payload = payload
  || jsonb_build_object('intros', jsonb_build_object(
      'levels',   'Ten levels, because different risks need different checks. The first rows are automated (a machine runs them on every change); the last are human — a person must judge whether a report READS correctly. "in-process" means the test calls the API in memory rather than over real HTTP, which is fast but does not exercise the network or the server.',
      'journey',  'The click-path a deal-team member actually follows, U1 to U9. Every automated and manual case below traces back to one of these steps.',
      'cases',    'Automated checks, run by pytest on every change. T-N = ingestion, T-A = Engine A (Fair Pay), T-B = Engine B (PSL), T-C = Engine C (Healthcare), T-O = output and cross-cutting. The E-numbers are the matching edge cases in the Simulated Data view — so each assertion names the data that proves it.',
      'manual',   'Run by a person on staging. These are the judgements automation cannot make: is a flagged row understandable, does the verdict read correctly, would a deal team trust this number.',
      'e2e',      'Designed, not yet built. Playwright drives a real browser through the whole journey, which is the one layer that exercises the UI and the network together.',
      'nonfunc',  'Not "does it work" but "is it fast, safe and repeatable". P1 blocks a release; P3 is a cleanup.'
  ))
where key = 'test_plan';

-- 3: M-12/M-13 -> the admin surfaces that exist on this branch.
update public.protected_content
set payload = jsonb_set(payload, '{manualCases}', (
      select jsonb_agg(
        case m->>'id'
          when 'M-12' then jsonb_build_object('id','M-12','case','Reference data screen',
                 'expected','Every external ruler (MIT, EPI, OEWS, PSL statutes, healthcare benchmarks) is shown as loaded, so a reviewer can check a number against its source')
          when 'M-13' then jsonb_build_object('id','M-13','case','Methodology admin',
                 'expected','Changing a global default freezes a NEW immutable methodology version rather than silently reusing the old snapshot')
          else m
        end)
      from jsonb_array_elements(payload->'manualCases') m)),
    updated_at = now()
where key = 'test_plan';

update public.protected_content
set payload = jsonb_set(payload, '{e2eFlows}', (
      select jsonb_agg(
        case f->>'id'
          when 'E2E-6' then jsonb_build_object('id','E2E-6',
                 'flow','Admin — reference data renders; changing a methodology default freezes a new version',
                 'covers','U9 · methodology governance')
          else f
        end)
      from jsonb_array_elements(payload->'e2eFlows') f)),
    updated_at = now()
where key = 'test_plan';
