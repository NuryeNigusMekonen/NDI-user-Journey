-- Correct every dataset figure and the two source claims that manual testing disproved.
--
-- The page has drifted three times because these numbers are hand-authored rather than read from
-- the fixtures. Values below are taken from backend/fixtures/*.expected.csv as of 21 July.
--
--   clean_baseline 5 · edge_ingestion 14 · edge_geo 3 · edge_fairpay_tax 6 · edge_psl 6
--   edge_healthcare 5 · scale_large 300 · all_combined 18   = 357 rows
--
-- edge_ingestion moved 8 -> 14: E29-E32 were added to cover the rest of the SOC-derivation
-- contract (blank title, invented title, ambiguous title, census code contradicting the title).
--
-- Two source-coverage claims are also wrong now:
--   MIT "app store has only 12 counties" - PU-23 promoted 597,360 MIT rows on 16 July; coverage
--       is national, which is precisely why the TC-M7 degraded fixture stopped firing (FF-008).
--   Peterson-KFF "never fires" - it DOES fire. The $869 per-person figure appears in every
--       Layer-2A calculation. It is thin (2 rows, 2023 only), not absent (FF-009).

update public.protected_content
set payload = jsonb_set(
      jsonb_set(
        payload,
        '{datasetFiles}',
        (
          select jsonb_agg(
            case d->>'name'
              when 'edge_ingestion' then jsonb_set(
                jsonb_set(d, '{rows}', '14'::jsonb),
                '{purpose}', to_jsonb('E2-E8 + E28-E32: coding, E/N exempt, blank-Code, dupes, HSA, and the full SOC-derivation contract'::text))
              when 'clean_baseline'   then jsonb_set(d, '{rows}', '5'::jsonb)
              when 'edge_geo'         then jsonb_set(d, '{rows}', '3'::jsonb)
              when 'edge_fairpay_tax' then jsonb_set(d, '{rows}', '6'::jsonb)
              when 'edge_psl'         then jsonb_set(d, '{rows}', '6'::jsonb)
              when 'edge_healthcare'  then jsonb_set(d, '{rows}', '5'::jsonb)
              when 'scale_large'      then jsonb_set(d, '{rows}', '300'::jsonb)
              when 'all_combined'     then jsonb_set(d, '{rows}', '18'::jsonb)
              else d
            end
          )
          from jsonb_array_elements(payload->'datasetFiles') as d
        )
      ),
      '{sourceCoverage}',
      (
        select jsonb_agg(
          case
            when s->>'source' like 'MIT%' then jsonb_set(
              jsonb_set(s, '{status}', '"strong"'),
              '{evidence}', to_jsonb('national - 3,144 counties promoted (PU-23, 16 July)'::text))
            when s->>'source' like 'Peterson%' then jsonb_set(
              jsonb_set(s, '{status}', '"thin"'),
              '{evidence}', to_jsonb('fires on every Layer-2A check, but rests on a single 2023 figure'::text))
            else s
          end
        )
        from jsonb_array_elements(payload->'sourceCoverage') as s
      )
    ),
    updated_at = now()
where key = 'dataset_catalog';

-- The footnote under the coverage table repeats the stale MIT claim.
update public.protected_content
set payload = jsonb_set(
      payload, '{datasetMeta,coverage}',
      to_jsonb('National: MIT covers 3,144 counties and EPI 3,143, so a basket is priced for '
            || 'almost any US residence. Peterson-KFF remains thin - one 2023 per-person figure '
            || 'carries the bad-year out-of-pocket screen, while every other ruler is 2025-26.'::text)
    ),
    updated_at = now()
where key = 'dataset_catalog';
