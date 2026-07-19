-- Correct the stale row total in datasetMeta.source: the datasetFiles sum is 350
-- (4+8+3+6+6+5+300+18), not 351 — 351 predates edge_ingestion dropping 9 -> 8 rows.
update public.protected_content
set payload = jsonb_set(payload, '{datasetMeta,source}',
      to_jsonb('backend/scripts/gen_test_datasets.py + scripts/warehouse_ref.py · 350 rows across 8 datasets'::text)),
    updated_at = now()
where key = 'dataset_catalog';
