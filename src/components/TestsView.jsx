import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, FlaskConical, Hand, MonitorPlay, Gauge, Loader2 } from 'lucide-react';
import { useProtectedContent } from '../hooks/useProtectedContent';

const PRIORITY = { P1: 'text-amber bg-amber/15 border-amber/40', P2: 'text-brand bg-brand/10 border-brand/30', P3: 'text-slate bg-slate/10 border-slate/30' };

const STATUS = {
  exists: { icon: CheckCircle2, cls: 'text-teal', label: 'exists' },
  partial: { icon: AlertTriangle, cls: 'text-amber', label: 'partial' },
  gap: { icon: XCircle, cls: 'text-slate', label: 'gap' },
};

function Centered({ children }) {
  return <div className="h-full flex items-center justify-center bg-canvas text-ink-muted text-sm">{children}</div>;
}

export default function TestsView() {
  const { payload, loading, error } = useProtectedContent('test_plan');

  if (loading) return <Centered><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading test plan…</Centered>;
  if (error || !payload) return <Centered>{error || 'No content.'}</Centered>;

  const { testLevels, userPath, testGroups, testMeta, manualCases, uat, e2eFlows, nonFunctional } = payload;

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

        {/* §4 Manual test plan + UAT */}
        <Section title="Manual test plan (human-run)">
          <div className="flex items-center gap-2 mb-2 text-ink-muted">
            <Hand className="w-3.5 h-3.5 text-amber" strokeWidth={2.25} />
            <span className="text-[10px] font-mono">run by a tester on staging — automation can’t judge these</span>
          </div>
          <div className="space-y-1.5">
            {manualCases.map((m) => (
              <div key={m.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                <span className="text-[10px] font-mono font-bold text-amber w-10 shrink-0">{m.id}</span>
                <span className="text-[12px] font-semibold text-ink w-44 shrink-0">{m.case}</span>
                <span className="text-[11px] text-ink-muted min-w-0 flex-1">{m.expected}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-amber/5 border border-amber/20">
            <p className="text-[10px] font-mono font-semibold text-amber mb-1">UAT — acceptance sign-off</p>
            <p className="text-[11px] text-ink-muted">{uat.note}</p>
            <p className="text-[11px] text-ink mt-1"><span className="text-amber">Exit:</span> {uat.exit}</p>
          </div>
        </Section>

        {/* §5 Frontend E2E design */}
        <Section title="Frontend E2E automation (Playwright)">
          <div className="flex items-center gap-2 mb-2">
            <MonitorPlay className="w-3.5 h-3.5 text-violet" strokeWidth={2.25} />
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet/15 text-violet border border-violet/30">DESIGN ONLY — no test code yet</span>
          </div>
          <div className="space-y-1.5">
            {e2eFlows.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                <span className="text-[10px] font-mono font-bold text-violet w-14 shrink-0">{e.id}</span>
                <span className="text-[12px] text-ink min-w-0 flex-1">{e.flow}</span>
                <span className="text-[9px] font-mono text-ink-muted shrink-0">{e.covers}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* §6 Non-functional */}
        <Section title="Non-functional testing">
          <div className="flex items-center gap-2 mb-2 text-ink-muted">
            <Gauge className="w-3.5 h-3.5 text-teal" strokeWidth={2.25} />
            <span className="text-[10px] font-mono">performance · security · reproducibility · accessibility</span>
          </div>
          <div className="space-y-1.5">
            {nonFunctional.map((n) => (
              <div key={n.type + n.case} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY[n.priority]}`}>{n.priority}</span>
                <span className="text-[12px] font-semibold text-ink w-40 shrink-0">{n.type}</span>
                <span className="text-[11px] text-ink-muted min-w-0 flex-1">{n.case}</span>
              </div>
            ))}
          </div>
        </Section>
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
