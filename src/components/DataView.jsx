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

  const { datasetFiles, edgeVariations, datasetMeta } = payload;
  const totalRows = datasetFiles.reduce((n, d) => n + d.rows, 0);
  return (
    <div className="h-full overflow-y-auto bg-canvas px-8 py-7">
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

        {/* edge variations */}
        {edgeVariations.map((grp) => (
          <Section key={grp.group} title={grp.group}>
            <div className="space-y-1.5">
              {grp.items.map((it) => (
                <div key={it.id} className="group flex items-start gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                  <span className="text-[10px] font-mono font-bold text-violet w-9 shrink-0">{it.id}</span>
                  <span className="text-[12px] text-ink w-1/2 shrink-0">{it.variation}</span>
                  <span className="text-[11px] text-ink-muted min-w-0 flex-1">{it.expected}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
