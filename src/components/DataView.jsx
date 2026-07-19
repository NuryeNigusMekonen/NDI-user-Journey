import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, FileSpreadsheet, Copy, Check, Loader2 } from 'lucide-react';
import { useProtectedContent } from '../hooks/useProtectedContent';

function CopyButton({ text, label = 'copy' }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard unavailable — no-op
    }
  };
  return (
    <button
      onClick={onCopy}
      className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-hairline text-ink-muted hover:text-brand hover:border-brand/40 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-teal" /> : <Copy className="w-3 h-3" />}
      {copied ? 'copied' : label}
    </button>
  );
}

export default function DataView() {
  const { payload, loading, error } = useProtectedContent('dataset_catalog');

  if (loading) return <div className="h-full flex items-center justify-center bg-canvas text-ink-muted text-sm"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading datasets…</div>;
  if (error || !payload) return <div className="h-full flex items-center justify-center bg-canvas text-ink-muted text-sm">{error || 'No content.'}</div>;

  const { datasetFiles, edgeVariations, datasetMeta, sourceCoverage, sampleRows } = payload;
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
            <p className="text-[10px] font-mono text-ink-muted mt-1.5">{datasetMeta.source}</p>
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
          action={<CopyButton label="copy all" text={datasetFiles.map((d) => `${d.name}.xlsx (${d.rows} rows) — ${d.purpose} → ${d.outcome}`).join('\n')} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {datasetFiles.map((d) => (
              <div key={d.name} className="p-3 rounded-lg bg-surface border border-hairline">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-teal shrink-0" strokeWidth={2.25} />
                  <span className="text-[13px] font-mono font-semibold text-ink">{d.name}</span>
                  <span className="text-[9px] font-mono text-brand ml-auto">{d.rows} rows</span>
                  <CopyButton text={`${d.name}.xlsx (${d.rows} rows)\nPurpose: ${d.purpose}\nExpected: ${d.outcome}`} />
                </div>
                <p className="text-[11px] text-ink-muted mt-1.5">{d.purpose}</p>
                <p className="text-[10px] font-mono text-teal/80 mt-1">→ {d.outcome}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* REAL rows straight from the generated workbook — the data itself, not a description */}
        {sampleRows?.rows?.length > 0 && (
          <Section
            title={`Sample rows — actual generated data (${sampleRows.headers.length} columns)`}
            action={<CopyButton label="copy as TSV" text={[sampleRows.headers.join('\t'), ...sampleRows.rows.map((r) => r.join('\t'))].join('\n')} />}
          >
            <p className="text-[11px] text-ink-muted mb-2">
              Straight out of <span className="font-mono text-teal">scale_large.xlsx</span> under the real
              59-column ND3 template — scroll right to see every field.
            </p>
            <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
              <table className="text-[10px] font-mono whitespace-nowrap">
                <thead>
                  <tr className="border-b border-hairline">
                    {sampleRows.headers.map((h, i) => (
                      <th key={i} className="text-left px-2 py-1.5 text-brand/80 font-semibold">{h}</th>
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
            action={<CopyButton label="copy all" text={sourceCoverage.map((s) => `${s.source} — ${s.evidence} [${s.status}]`).join('\n')} />}
          >
            <div className="space-y-1.5">
              {sourceCoverage.map((s) => {
                const cls = s.status === 'strong' || s.status === 'good'
                  ? 'text-teal bg-teal/10 border-teal/30'
                  : s.status === 'thin'
                    ? 'text-amber bg-amber/10 border-amber/30'
                    : 'text-slate bg-slate/10 border-slate/30';
                return (
                  <div key={s.source} className="flex flex-col sm:flex-row items-start gap-1.5 sm:gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                    <span className="text-[12px] font-semibold text-ink w-full sm:w-44 sm:shrink-0">{s.source}</span>
                    <span className="text-[11px] text-ink-muted min-w-0 flex-1">{s.evidence}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${cls}`}>{s.status}</span>
                  </div>
                );
              })}
            </div>
            {datasetMeta.blocked && (
              <p className="text-[11px] text-amber/90 mt-3 p-3 rounded-lg bg-amber/5 border border-amber/20">{datasetMeta.blocked}</p>
            )}
          </Section>
        )}

        {/* edge variations */}
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
