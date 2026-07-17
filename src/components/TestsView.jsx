import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, FlaskConical } from 'lucide-react';
import { testLevels, userPath, testGroups, testMeta } from '../data/tests';

const STATUS = {
  exists: { icon: CheckCircle2, cls: 'text-teal', label: 'exists' },
  partial: { icon: AlertTriangle, cls: 'text-amber', label: 'partial' },
  gap: { icon: XCircle, cls: 'text-slate', label: 'gap' },
};

export default function TestsView() {
  return (
    <div className="h-full overflow-y-auto bg-canvas px-8 py-7">
      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-brand/15 border border-brand/40 flex items-center justify-center">
            <FlaskConical className="w-[18px] h-[18px] text-brand" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="font-display text-[19px] font-bold text-ink tracking-tight leading-none">Test Plan</h2>
            <p className="text-[10px] font-mono text-ink-muted mt-1.5">{testMeta.source}</p>
          </div>
        </div>
        <span className="inline-block mt-3 text-[10px] font-mono px-2 py-1 rounded bg-amber/10 text-amber border border-amber/30">
          {testMeta.status}
        </span>

        {/* test levels */}
        <Section title="Test levels">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {testLevels.map((l) => {
              const s = STATUS[l.status];
              const Icon = s.icon;
              return (
                <div key={l.level} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-hairline">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${s.cls}`} strokeWidth={2.25} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">{l.level}</span>
                      <span className={`text-[9px] font-mono ${s.cls}`}>{s.label}</span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5">{l.scope}</p>
                    <p className="text-[10px] font-mono text-brand/70 mt-1">{l.tool}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* user path */}
        <Section title="Deal-team user journey (U1–U8)">
          <div className="space-y-1.5">
            {userPath.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                <span className="text-[10px] font-mono font-bold text-brand w-7 shrink-0">{u.id}</span>
                <span className="text-[13px] font-semibold text-ink w-40 shrink-0">{u.step}</span>
                <span className="text-[10px] font-mono text-teal w-52 shrink-0 truncate">{u.where}</span>
                <span className="text-[11px] text-ink-muted min-w-0 truncate">{u.note}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* test cases by stage */}
        {testGroups.map((g) => (
          <Section key={g.stage} title={g.stage}>
            <div className="space-y-1.5">
              {g.cases.map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                  <span className="text-[10px] font-mono font-bold text-brand w-12 shrink-0">{c.id}</span>
                  <span className="text-[12px] text-ink min-w-0 flex-1">{c.assert}</span>
                  <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[30%]">
                    {c.edges.map((e) => (
                      <span key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet/15 text-violet border border-violet/30">{e}</span>
                    ))}
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

function Section({ title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-7">
      <p className="text-[10px] font-mono font-semibold tracking-[0.18em] uppercase text-brand/70 mb-3">{title}</p>
      {children}
    </motion.div>
  );
}
