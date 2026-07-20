-- E28: a census that does not supply SOC codes.
--
-- census-structure.md defines soc_code as "derived from title if blank", and the derivation is
-- implemented (O*NET alt-title lookup, with a rival-occupation confidence check). But every
-- generated row supplied a SOC, so no fixture exercised the fallback -- the branch that runs on a
-- real acquisition target that does not track SOC codes.
--
-- That matters to the number: a title->SOC misfire puts the employee on the wrong OEWS prevailing
-- wage, which moves the Fair Pay gap. Verified end to end before adding: 'Sales Managers'
-- resolves to 11-2022 at confidence 1.0 with no rival.
--
-- Also refreshes the two row counts this new row changed.

update public.protected_content
set payload = jsonb_set(
      jsonb_set(
        payload,
        '{edgeVariations}',
        (
          select jsonb_agg(
            case
              when grp->>'group' like 'Stage 0 · Ingestion%' or grp->>'group' like 'A%'
              then jsonb_set(
                grp, '{items}',
                (grp->'items') || jsonb_build_object(
                  'id', 'E28',
                  'variation', 'Census supplies no SOC code (blank), title present',
                  'expected',
                    'SOC is derived from the title via the O*NET alternate-title table and marked '
                    || 'soc_source=derived. A census-supplied code always wins and is instead '
                    || 'cross-checked against the title (soc_title_agrees). A near-tied second '
                    || 'occupation is surfaced as a rival with its confidence rather than silently '
                    || 'chosen; no match at all yields soc_source=unmatched, never a stub.'
                )
              )
              else grp
            end
          )
          from jsonb_array_elements(payload->'edgeVariations') as grp
        )
      ),
      '{datasetFiles}',
      (
        select jsonb_agg(
          case
            when d->>'name' = 'edge_ingestion' then jsonb_set(
              jsonb_set(d, '{rows}', '8'::jsonb),
              '{purpose}', to_jsonb('E1-E8 + E28: coding, E/N exempt, blank-Code, dupes, HSA, derived SOC'::text))
            when d->>'name' = 'all_combined' then jsonb_set(d, '{rows}', '18'::jsonb)
            else d
          end
        )
        from jsonb_array_elements(payload->'datasetFiles') as d
      )
    ),
    updated_at = now()
where key = 'dataset_catalog';
