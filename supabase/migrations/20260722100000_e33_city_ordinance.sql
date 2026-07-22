-- E33: an employee working inside a CITY paid-sick-leave ordinance.
--
-- Manual testing found that the reference data carries 15 city and 2 county ordinances from A
-- Better Balance, but Engine B reads state rows only (store.psl_state_floor filters
-- jurisdiction_type='state'). Local floors are often HIGHER - Berkeley requires 48h where
-- California requires 40h - so an employee there is costed low and remediation is understated.
-- Recorded as FF-010.
--
-- The fixture uses ZIP 94707 (Berkeley/Albany), which resolves to Alameda County and is therefore
-- valid geography whichever signal the platform eventually uses to detect a work city. The row
-- scores 40h today, demonstrating the gap, and must score 48h once local ordinances are applied.

update public.protected_content
set payload = jsonb_set(
      payload, '{edgeVariations}',
      (
        select jsonb_agg(
          case
            when grp->>'group' like '%Paid Sick Leave%' then jsonb_set(
              grp, '{items}',
              (grp->'items') || jsonb_build_object(
                'id', 'E33',
                'variation', 'An employee working in a city with its own sick-leave law',
                'expected',
                  'Fifteen cities and two counties set their own paid-sick-leave minimums, and they '
                  || 'are frequently higher than the state''s - Berkeley requires 48 hours where '
                  || 'California requires 40. The employee should be measured against whichever '
                  || 'floor is higher. CURRENTLY NOT APPLIED: the reference screen lists all 42 '
                  || 'jurisdictions but the engine reads only the 25 state rows, so a Berkeley '
                  || 'employee is costed at 40 hours and the remediation is understated (FF-010).'
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

-- edge_psl grows by one row.
update public.protected_content
set payload = jsonb_set(
      payload, '{datasetFiles}',
      (
        select jsonb_agg(
          case
            when d->>'name' = 'edge_psl' then jsonb_set(
              jsonb_set(d, '{rows}', '7'::jsonb),
              '{purpose}', to_jsonb('E18-E22 + E33: preempted, no-cap, capped, part-time, exempt, and a city ordinance'::text))
            else d
          end
        )
        from jsonb_array_elements(payload->'datasetFiles') as d
      )
    ),
    updated_at = now()
where key = 'dataset_catalog';
