-- Relabel the edge-case groups so they name the pipeline stage or engine they belong to.
--
-- The old labels were A–E, which collided with the engines' own names: Engine A (Fair Pay) sat in
-- group C, Engine B (PSL) in group D. Groups A and B were not engines at all — they are the
-- ingestion and geo stages that run BEFORE any engine, which is exactly why they are separate
-- (a ZIP that will not resolve fails upstream of Engine A, so grouping it under an engine would
-- point diagnosis at the wrong place).
--
-- E-numbers (E1–E27) are unchanged.
update public.protected_content
set payload = jsonb_set(payload, '{edgeVariations}', (
      select jsonb_agg(
        case
          when g->>'group' like 'A %' then jsonb_set(g, '{group}', '"Stage 0 · Ingestion / normalization"')
          when g->>'group' like 'B %' then jsonb_set(g, '{group}', '"Stage 0 · Geo / county resolution"')
          when g->>'group' like 'C %' then jsonb_set(g, '{group}', '"Engine A · Fair Pay (basket + tax gross-up)"')
          when g->>'group' like 'D %' then jsonb_set(g, '{group}', '"Engine B · Paid Sick Leave"')
          when g->>'group' like 'E %' then jsonb_set(g, '{group}', '"Engine C · Affordable Healthcare"')
          else g
        end)
      from jsonb_array_elements(payload->'edgeVariations') g)),
    updated_at = now()
where key = 'dataset_catalog';
