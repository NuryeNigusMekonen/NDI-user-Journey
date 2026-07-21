-- Finish correcting the Simulated Data page. The previous migration fixed the status badges and
-- evidence lines but left three other fields carrying the same disproved claims, so the MIT row
-- now contradicts itself: the badge reads "strong - national" while the feeds line underneath
-- still says "the app reference store has 12".
--
-- Also folds in the two edge-case corrections that were written earlier but never applied
-- (20260720100000 and part of 20260720110000), so a single migration brings the page fully true
-- whether or not those ran.

update public.protected_content
set payload = jsonb_set(
      payload, '{sourceCoverage}',
      (
        select jsonb_agg(
          case
            when s->>'source' like 'MIT%' then jsonb_set(s, '{feeds}',
              to_jsonb('Engine A basket - national coverage: 3,144 of 3,222 US counties. The 78 without MIT are all Puerto Rico, which MIT does not publish.'::text))
            when s->>'source' like 'Peterson%' then jsonb_set(s, '{feeds}',
              to_jsonb('Engine C out-of-pocket exposure - the $869 per-person figure carries every Layer-2A and 2B check'::text))
            else s
          end
        )
        from jsonb_array_elements(payload->'sourceCoverage') as s
      )
    ),
    updated_at = now()
where key = 'dataset_catalog';

-- The edge-variation intro counts the list itself, and E10/E12 record what testing established.
update public.protected_content
set payload = jsonb_set(
      jsonb_set(
        payload,
        '{datasetMeta,status}',
        to_jsonb('MIT and EPI now cover the country (3,144 and 3,143 counties), so the earlier '
              || '12-county limit no longer applies. Peterson-KFF is still thin: a single 2023 '
              || 'per-person figure carries the bad-year out-of-pocket screen while every other '
              || 'ruler is 2025-26 - a DE loading gap, not a fixture gap.'::text)
      ),
      '{edgeVariations}',
      (
        select jsonb_agg(
          jsonb_set(grp, '{items}', (
            select jsonb_agg(
              case item->>'id'
                when 'E10' then jsonb_build_object(
                  'id', 'E10',
                  'variation', 'Split-ZIP (residence ZIP spans two or more counties)',
                  'expected',
                    'The ZIP identifies the candidate counties; the engine then compares each '
                    || 'candidate''s Fair Pay basket and scores against the HIGHEST-COST one, so an '
                    || 'ambiguous residence never understates remediation. Land-area share only '
                    || 'breaks an exact cost tie. Verified in manual testing (TC-M16): a ZIP '
                    || 'resolved to the 40%-land-area county because its basket cost more. Not '
                    || 'exercised by a fixture row - proven by test_split_zip_resolution.py.')
                when 'E12' then jsonb_build_object(
                  'id', 'E12',
                  'variation', 'County with no basket data (degraded)',
                  'expected',
                    'An uncovered county must yield a DEGRADED basket, visibly marked, so a partial '
                    || 'number is never shown as full confidence. CURRENTLY UNTESTABLE: MIT now '
                    || 'covers 3,144 counties, so the fixture ZIP no longer degrades, and the only '
                    || 'MIT-less counties are Puerto Rico, whose ZIPs resolve to no county at all. '
                    || 'The guarantee is therefore unverified end to end.')
                else item
              end
            )
            from jsonb_array_elements(grp->'items') as item
          ))
        )
        from jsonb_array_elements(payload->'edgeVariations') as grp
      )
    ),
    updated_at = now()
where key = 'dataset_catalog';
