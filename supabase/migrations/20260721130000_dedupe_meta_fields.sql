-- Clean up the four datasetMeta fields, which I corrected one at a time without checking what
-- each one actually renders as. The page currently shows:
--   * the same MIT/EPI/Peterson paragraph TWICE (I wrote it to `coverage`, then again to `status`)
--   * `status` as a long paragraph inside a small amber BADGE, which is not what that slot is for
--   * the original stale claim still under the source table, because it lives in a fourth field
--     (`blocked`) that neither earlier migration touched
--
-- What each field is for, read from DataView.jsx:
--   source   line 101  small mono line under the title
--   status   line 106  short amber BADGE - a few words, not a paragraph
--   coverage line 111  the explanatory paragraph under the badges
--   blocked  line 299  the amber footnote under the reference-source table

update public.protected_content
set payload = payload
      || jsonb_build_object('datasetMeta',
           (payload->'datasetMeta')
           || jsonb_build_object(
                'status', 'national coverage',
                'coverage',
                  'MIT and EPI now price a basket for almost any US residence - 3,144 and 3,143 '
                  || 'counties. Peterson-KFF is the one thin ruler: a single 2023 per-person figure '
                  || 'carries the bad-year out-of-pocket screen while every other source is 2025-26.',
                'blocked',
                  'Peterson-KFF holds 2 rows in the warehouse, so the out-of-pocket screens rest on '
                  || 'one 2023 figure - a DE loading gap, not a fixture gap. MIT''s earlier '
                  || '12-county limit no longer applies: PU-23 promoted 597,360 rows on 16 July, '
                  || 'which is also why the degraded-basket case (E12) can no longer fire.'
              )
         ),
    updated_at = now()
where key = 'dataset_catalog';
