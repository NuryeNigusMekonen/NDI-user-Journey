-- Correct the E10 split-ZIP description: the page states the OPPOSITE of what the engine does.
--
-- The content was written when `split_zip_resolution` defaulted to `largest_share`, so E10 read
-- "Resolved via land-area share". The db-replacing branch ships `max_cost_basket`
-- (tests/golden/sample_result.json confirms it), which resolves an ambiguous residence to the
-- HIGHEST-COST candidate county so remediation can never be understated. Land-area share now only
-- breaks an exact cost tie.
--
-- This is a doc-vs-code lie on a client-facing page describing a methodology decision that moves
-- the number, which makes it worth its own migration rather than waiting for a content rewrite.
--
-- Also marks E10 as NOT COVERED by the fixtures. The sample census has no split ZIPs (foot-gun #2
-- in CLAUDE.md), so no generated row exercises this path -- it is proven by
-- backend/tests/test_split_zip_resolution.py against the real 55906 crosswalk instead. Claiming
-- fixture coverage we do not have is the same class of error as the wrong description.

update public.protected_content
set payload = jsonb_set(
      payload,
      '{edgeVariations}',
      (
        select jsonb_agg(
          case
            when grp->>'group' like 'B%' then jsonb_set(
              grp,
              '{items}',
              (
                select jsonb_agg(
                  case
                    when item->>'id' = 'E10' then jsonb_build_object(
                      'id', 'E10',
                      'variation', 'Split-ZIP (residence ZIP spans two or more counties)',
                      'expected',
                        'ZIP identifies the candidate counties; the engine then compares each '
                        || 'candidate''s Fair Pay basket and scores against the HIGHEST-COST one, '
                        || 'so an ambiguous residence never understates remediation. The pick '
                        || 'becomes the county of record (basket, local tax, display, frozen '
                        || 'snapshot) and is flagged "verify". An exact cost tie keeps the '
                        || 'largest-land-area county. Not exercised by a fixture row — proven by '
                        || 'test_split_zip_resolution.py on the real 55906 crosswalk.'
                    )
                    else item
                  end
                )
                from jsonb_array_elements(grp->'items') as item
              )
            )
            else grp
          end
        )
        from jsonb_array_elements(payload->'edgeVariations') as grp
      )
    ),
    updated_at = now()
where key = 'dataset_catalog';
