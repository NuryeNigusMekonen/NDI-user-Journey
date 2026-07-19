-- Correct the dataset row counts to what the workbooks ACTUALLY contain.
--
-- The catalog carried the generator's *designed* row counts, but three files differ once written:
-- a deliberately blank-Code row reads as an empty row in the sheet. Counted directly from
-- backend/fixtures/*.xlsx:
--     clean_baseline  4 -> 5      edge_ingestion  8 -> 7      all_combined 18 -> 17
--     total          350/352 -> 349
-- The header string and the computed badge disagreed (352 vs 350); both are now 349.
update public.protected_content
set payload = jsonb_set(
      jsonb_set(payload, '{datasetFiles}', (
        select jsonb_agg(
          case d->>'name'
            when 'clean_baseline' then jsonb_set(d, '{rows}', '5')
            when 'edge_ingestion' then jsonb_set(d, '{rows}', '7')
            when 'all_combined'   then jsonb_set(d, '{rows}', '17')
            else d
          end)
        from jsonb_array_elements(payload->'datasetFiles') d)),
      '{datasetMeta,source}', to_jsonb(
        'backend/scripts/gen_test_datasets.py + scripts/warehouse_ref.py · 349 rows across 8 datasets · 59/59 template columns'::text)),
    updated_at = now()
where key = 'dataset_catalog';
