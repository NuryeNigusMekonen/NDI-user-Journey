-- Stop the Simulated Data page claiming coverage the generated data does not have.
--
-- Three overstatements, all verified against backend/fixtures/*.expected.csv:
--
--   E1  "Abbreviation-coded labels"  — NO fixture row generates one. The alias two-pass is real
--       and unit-tested, but no simulated census exercises it, so listing it beside 25 variations
--       that ARE generated implies data coverage that does not exist.
--   E10 "Split-ZIP"                  — NO fixture row (the sample census has no split ZIPs,
--       foot-gun #2). Covered by test_split_zip_resolution.py on the real 55906 crosswalk.
--   E20 "CA 40h, NY 56h, AZ/IL 40h"  — only CA and NY rows are generated. AZ/IL are named but
--       never exercised.
--
-- Each now says what proves it instead of implying a fixture row. A page that goes to a client
-- must not overstate the evidence behind a number.

update public.protected_content
set payload = jsonb_set(
      payload,
      '{edgeVariations}',
      (
        select jsonb_agg(
          jsonb_set(
            grp,
            '{items}',
            (
              select jsonb_agg(
                case
                  when item->>'id' = 'E1' then jsonb_set(
                    item, '{expected}',
                    to_jsonb(
                      'Alias two-pass (exact then substring, order-sensitive) still maps them. '
                      || 'NOT exercised by a generated row — proven by the parser/alias unit tests.'
                    ))
                  when item->>'id' = 'E20' then jsonb_set(
                    item, '{expected}',
                    to_jsonb(
                      'Floor applied; gap costed. Generated rows cover CA (40h) and NY (56h); '
                      || 'AZ/IL follow the same statutory-cap path but have no fixture row.'
                    ))
                  else item
                end
              )
              from jsonb_array_elements(grp->'items') as item
            )
          )
        )
        from jsonb_array_elements(payload->'edgeVariations') as grp
      )
    ),
    updated_at = now()
where key = 'dataset_catalog';
