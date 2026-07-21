import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, FileSpreadsheet, Copy, Check, Loader2, Download, Eye, ChevronDown } from 'lucide-react';
import { useProtectedContent } from '../hooks/useProtectedContent';

function CopyButton({ text, label = 'copy' }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // navigator.clipboard needs a secure context and can be blocked by permissions policy.
      // Fall back to a hidden textarea + execCommand, which works without either.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand refused');
        setCopied(true);
      } catch {
        setFailed(true);                    // an empty catch made this button look broken
        setTimeout(() => setFailed(false), 1800);
        return;
      }
    }
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button
      onClick={onCopy}
      className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-hairline text-ink-muted hover:text-brand hover:border-brand/40 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-teal" /> : <Copy className="w-3 h-3" />}
      {copied ? 'copied' : failed ? 'copy blocked' : label}
    </button>
  );
}

// Each fixture represents a different fictional acquisition target; the name is stamped into the
// workbook's own "Company Name:" header cell by scripts/gen_test_datasets.py. Showing it here
// means a reviewer can tell the files apart before downloading, and recognise one afterwards.
const COMPANY = {
  clean_baseline: 'Cedar Ridge Manufacturing, Inc.',
  edge_ingestion: 'Halstead Logistics Group, LLC',
  edge_geo: 'Three Rivers Facilities Services, Inc.',
  edge_fairpay_tax: 'Brightwater Food Processing Co.',
  edge_psl: 'Kestrel Retail Holdings, Inc.',
  edge_healthcare: 'Anvil Point Industrial Services, LLC',
  scale_large: 'Meridian Care Partners, Inc.',
  all_combined: 'Composite Diligence Target (all edge cases)',
};

// The generated workbooks ship as static assets, so a download is a plain link — no backend,
// no auth round-trip, and the file the reviewer gets is byte-identical to what the engines ran on.
function DownloadLink({ name }) {
  return (
    <a
      href={`${import.meta.env.BASE_URL || '/'}fixtures/${name}.xlsx`}
      download
      className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-brand/40 text-brand hover:bg-brand/10 transition-colors"
      title="Download the census workbook (.xlsx) — all 59 ND3 columns"
    >
      <Download className="w-3 h-3" />
      .xlsx
    </a>
  );
}

export default function DataView() {
  const { payload, loading, error } = useProtectedContent('dataset_catalog');
  // Which dataset card has its preview expanded (one at a time keeps the page readable).
  const [openPreview, setOpenPreview] = useState(null);

  if (loading) return <div className="h-full flex items-center justify-center bg-canvas text-ink-muted text-sm"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading datasets…</div>;
  if (error || !payload) return <div className="h-full flex items-center justify-center bg-canvas text-ink-muted text-sm">{error || 'No content.'}</div>;

  const { datasetFiles, edgeVariations, datasetMeta, sourceCoverage, sampleRows, previews } = payload;
  const totalRows = datasetFiles.reduce((n, d) => n + d.rows, 0);
  return (
    <div className="h-full overflow-y-auto bg-canvas px-4 sm:px-8 py-5 sm:py-7">
      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-brand/15 border border-brand/40 flex items-center justify-center">
            <Database className="w-[18px] h-[18px] text-brand" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="font-display text-[19px] font-bold text-ink tracking-tight leading-none">Simulated Census Data</h2>
            {/* The authored `source` string used to carry its own row count, which drifted from
                the per-file numbers rendered below it — 349 in the header against 351 on the
                badge. Strip any embedded count so there is ONE derived figure on the page. */}
            <p className="text-[10px] font-mono text-ink-muted mt-1.5">
              {String(datasetMeta.source || '').replace(/\s*·?\s*\d[\d,]*\s+rows?\s+across\s+\d+\s+datasets?/i, '')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber/10 text-amber border border-amber/30">{datasetMeta.status}</span>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-surface text-ink-muted border border-hairline">
            {datasetFiles.length} datasets · {totalRows} rows
          </span>
        </div>
        <p className="text-[11px] text-ink-muted mt-3 max-w-2xl">{datasetMeta.coverage}</p>

        {/* dataset files */}
        <Section
          title="Dataset suite"
        >
          <p className="text-[11px] text-ink-muted mb-2">
            Hit <span className="text-brand">preview</span> to see the first rows of a dataset — each
            with the edge case it targets and what should happen — then download the
            <span className="font-mono text-brand"> .xlsx</span> to get the full census workbook under
            the real 59-column ND3 template, ready to upload straight into the platform.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {datasetFiles.map((d) => (
              <div key={d.name} className="p-3 rounded-lg bg-surface border border-hairline">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-teal shrink-0" strokeWidth={2.25} />
                  <span className="text-[13px] font-mono font-semibold text-ink">{d.name}</span>
                  <span className="text-[9px] font-mono text-brand ml-auto">{d.rows} rows</span>
                </div>
                {COMPANY[d.name] && (
                  <p className="text-[10px] font-mono text-violet/85 mt-1" title="Company Name in the workbook header">
                    {COMPANY[d.name]}
                  </p>
                )}
                <p className="text-[11px] text-ink-muted mt-1.5">{d.purpose}</p>
                <p className="text-[10px] font-mono text-teal/80 mt-1">→ {d.outcome}</p>
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-hairline/60">
                  <DownloadLink name={d.name} />
                  {previews?.[d.name] && (
                    <button
                      onClick={() => setOpenPreview(openPreview === d.name ? null : d.name)}
                      className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                        openPreview === d.name
                          ? 'border-brand/50 text-brand bg-brand/10'
                          : 'border-hairline text-ink-muted hover:text-brand hover:border-brand/40'
                      }`}
                    >
                      {openPreview === d.name ? <ChevronDown className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      preview
                    </button>
                  )}
                </div>

                {/* Inline preview: enough to answer "is this the file I want?" without downloading.
                    Carries each row's expected behaviour, which used to live only in the .csv. */}
                {openPreview === d.name && previews?.[d.name] && (
                  <div className="mt-2 overflow-x-auto max-h-[320px] overflow-y-auto rounded-md border border-hairline bg-canvas/60">
                    <table className="text-[9px] font-mono whitespace-nowrap w-full">
                      <thead>
                        <tr className="border-b border-hairline">
                          {previews[d.name].headers.map((h) => (
                            <th key={h} className="text-left px-1.5 py-1 text-brand/70 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previews[d.name].rows.map((r, ri) => (
                          <tr key={ri} className="border-b border-hairline/40 last:border-0">
                            {r.map((cell, ci) => (
                              <td key={ci} className={`px-1.5 py-1 ${
                                ci === r.length - 1 ? 'text-teal/80 whitespace-normal min-w-[180px]'
                                  : cell ? 'text-ink' : 'text-ink-muted/30'}`}>
                                {cell || '·'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[9px] font-mono text-ink-muted/60 px-1.5 py-1">
                      first {previews[d.name].rows.length} of {d.rows} rows · all {previews[d.name].headers.length - 2} template columns, scroll right · download the .xlsx for every row
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* REAL rows straight from the generated workbook — the data itself, not a description */}
        {sampleRows?.rows?.length > 0 && (
          <Section
            title={`Sample rows — actual generated data (${sampleRows.headers.length} columns)`}
            action={(
              <div className="flex items-center gap-1.5">
                <DownloadLink name="scale_large" />
                <CopyButton label="copy as TSV" text={[sampleRows.headers.join('\t'), ...sampleRows.rows.map((r) => r.join('\t'))].join('\n')} />
              </div>
            )}
          >
            <p className="text-[11px] text-ink-muted mb-2">
              Straight out of <span className="font-mono text-teal">scale_large.xlsx</span> under the real
              59-column ND3 template — scroll right to see every field. Columns drawn from a reference
              source are labelled beneath the header; the downloaded workbook carries the same detail on
              its <span className="font-mono text-teal">PROVENANCE</span> sheet.
            </p>
            <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
              <table className="text-[10px] font-mono whitespace-nowrap">
                <thead>
                  <tr className="border-b border-hairline">
                    {sampleRows.headers.map((h, i) => (
                      <th key={i} className="text-left px-2 py-1.5 align-top">
                        <span className="block text-brand/80 font-semibold">{h}</span>
                        {sampleRows.sources?.[i] && (
                          <span className="block text-[8px] font-normal text-teal/70 mt-0.5">
                            ← {sampleRows.sources[i]}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.rows.map((r, ri) => (
                    <tr key={ri} className="border-b border-hairline/50 last:border-0">
                      {r.map((cell, ci) => (
                        <td key={ci} className={`px-2 py-1 ${cell ? 'text-ink' : 'text-ink-muted/30'}`}>
                          {cell || '·'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* reference-source coverage — which of the 11 sources the fixtures actually exercise */}
        {sourceCoverage?.length > 0 && (
          <Section
            title="Reference-source coverage"
            action={<CopyButton label="copy all" text={sourceCoverage.map((s) => [
              `${s.source} [${s.status}]`,
              `  evidence: ${s.evidence}`,
              s.table ? `  table:    ${s.table}${s.rows && s.rows !== '—' ? ` (${s.rows} rows)` : ''}` : '',
              s.vintage ? `  vintage:  ${s.vintage}` : '',
              s.feeds ? `  feeds:    ${s.feeds}` : '',
            ].filter(Boolean).join('\n')).join('\n\n')} />}
          >
            <p className="text-[11px] text-ink-muted mb-2">
              Every source is traceable: the warehouse table it is read from, its row count and
              <span className="text-brand/80"> vintage</span>, and which engine input it feeds. All values read
              live from <span className="font-mono text-teal">public.ext_*</span> in the reference warehouse.
            </p>
            <div className="space-y-1.5">
              {sourceCoverage.map((s) => {
                const cls = s.status === 'strong' || s.status === 'good'
                  ? 'text-teal bg-teal/10 border-teal/30'
                  : s.status === 'thin'
                    ? 'text-amber bg-amber/10 border-amber/30'
                    : 'text-slate bg-slate/10 border-slate/30';
                return (
                  <div key={s.source} className="p-3 rounded-lg bg-surface border border-hairline">
                    <div className="flex items-start gap-3">
                      <span className="text-[12px] font-semibold text-ink min-w-0 flex-1">{s.source}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${cls}`}>{s.status}</span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-1">{s.evidence}</p>
                    {/* Provenance — where the number actually comes from, so it can be traced. */}
                    {(s.table || s.vintage || s.feeds) && (
                      <div className="mt-2 pt-2 border-t border-hairline/60 grid gap-1 text-[10px] font-mono">
                        {s.table && (
                          <div className="flex gap-2">
                            <span className="text-ink-muted/60 w-14 shrink-0">table</span>
                            <span className="text-teal break-all">{s.table}</span>
                            {s.rows && s.rows !== '—' && <span className="text-ink-muted/60 ml-auto shrink-0">{s.rows} rows</span>}
                          </div>
                        )}
                        {s.vintage && (
                          <div className="flex gap-2">
                            <span className="text-ink-muted/60 w-14 shrink-0">vintage</span>
                            <span className="text-brand/80">{s.vintage}</span>
                          </div>
                        )}
                        {s.feeds && (
                          <div className="flex gap-2">
                            <span className="text-ink-muted/60 w-14 shrink-0">feeds</span>
                            <span className="text-ink-muted">{s.feeds}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {datasetMeta.blocked && (
              <p className="text-[11px] text-amber/90 mt-3 p-3 rounded-lg bg-amber/5 border border-amber/20">{datasetMeta.blocked}</p>
            )}
          </Section>
        )}

        {/* edge variations — grouped by the pipeline stage or engine that owns the behaviour */}
        {(edgeVariations || []).length > 0 && (
          <Section title="Edge cases the data deliberately tests">
            {/* Counted from the content, not hardcoded: the previous literal "27" survived the
                list changing and overstated how many variations a generated row actually covers. */}
            <p className="text-[11px] text-ink-muted">
              {edgeVariations.reduce((n, g) => n + (g.items?.length || 0), 0)} input variations,
              each paired with the behaviour the platform must produce.{' '}
              <span className="text-amber/90">
                E1 and E10 have no generated row and are proven by engine tests instead; E12 cannot
                currently fire at all — see its note.
              </span>{' '}
              They are
              grouped by <span className="text-ink">where a failure would occur</span> — two pipeline
              stages that run before any engine (ingestion, then geo resolution), then the three
              engines. A ZIP that will not resolve fails upstream of Engine A, so it belongs to the geo
              stage, not to an engine.
            </p>
          </Section>
        )}
        {(edgeVariations || []).map((grp) => (
          <Section key={grp.group} title={grp.group}>
            <div className="space-y-1.5">
              {grp.items.map((it) => (
                <div key={it.id} className="group flex flex-col sm:flex-row items-start gap-1.5 sm:gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                  <span className="text-[10px] font-mono font-bold text-violet w-9 shrink-0">{it.id}</span>
                  <span className="text-[12px] text-ink w-full sm:w-1/2 sm:shrink-0">{it.variation}</span>
                  <span className="text-[11px] text-ink-muted min-w-0 flex-1">{it.expected}</span>
                  <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 self-end sm:self-auto">
                    <CopyButton text={`${it.id} — ${it.variation}\nExpected: ${it.expected}`} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ))}
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-7">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono font-semibold tracking-[0.18em] uppercase text-brand/70">{title}</p>
        {action}
      </div>
      {children}
    </motion.div>
  );
}
