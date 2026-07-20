import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, FlaskConical, MonitorPlay, Gauge, Loader2 } from 'lucide-react';
import { useProtectedContent } from '../hooks/useProtectedContent';
import TestRunLog from './TestRunLog';
import ManualCases from './ManualCases';

const PRIORITY = { P1: 'text-amber bg-amber/15 border-amber/40', P2: 'text-brand bg-brand/10 border-brand/30', P3: 'text-slate bg-slate/10 border-slate/30' };

const STATUS = {
  exists: { icon: CheckCircle2, cls: 'text-teal', label: 'exists' },
  partial: { icon: AlertTriangle, cls: 'text-amber', label: 'partial' },
  gap: { icon: XCircle, cls: 'text-slate', label: 'gap' },
  missing: { icon: XCircle, cls: 'text-slate', label: 'missing' },
};

/**
 * Resolve a status to its badge. Content is authored in Supabase, so a value
 * may arrive with trailing detail ("exists (159 app tests)") or be unknown —
 * match on the leading keyword and fall back rather than crash the view.
 */
function resolveStatus(raw) {
  const value = String(raw || '').trim().toLowerCase();
  const key = Object.keys(STATUS).find((k) => value.startsWith(k));
  return { meta: STATUS[key] || STATUS.gap, label: raw || 'unknown' };
}

function Centered({ children }) {
  return <div className="h-full flex items-center justify-center bg-canvas text-ink-muted text-sm">{children}</div>;
}

export default function TestsView() {
  const { payload, loading, error } = useProtectedContent('test_plan');
  // Manual cases now live in their own table, not in the payload. Lifting the IDs here keeps the
  // Run Log's case dropdown in sync when a tester adds or renames a case.
  const [caseIds, setCaseIds] = useState([]);
  // Stable identity: an inline arrow would re-fire the child's effect on every render.
  const handleCaseIds = useCallback((ids) => setCaseIds(ids), []);

  if (loading) return <Centered><Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading test plan…</Centered>;
  if (error || !payload) return <Centered>{error || 'No content.'}</Centered>;

  const { testLevels, userPath, testGroups, testMeta, uat, e2eFlows, nonFunctional, intros } = payload;
  // Short plain-language framing per section, authored in Supabase. Renders only when present.
  const Intro = ({ k }) => (intros?.[k]
    ? <p className="text-[11px] text-ink-muted mb-2.5 max-w-3xl leading-relaxed">{intros[k]}</p>
    : null);

  return (
    <div className="h-full overflow-y-auto bg-canvas px-4 sm:px-8 py-5 sm:py-7">
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
          <Intro k="levels" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {testLevels.map((l) => {
              const { meta: s, label } = resolveStatus(l.status);
              const Icon = s.icon;
              return (
                <div key={l.level} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-hairline">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${s.cls}`} strokeWidth={2.25} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">{l.level}</span>
                      <span className={`text-[9px] font-mono ${s.cls}`}>
                        {label}{l.detail ? ` · ${l.detail}` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5">{l.scope}</p>
                    <p className="text-[10px] font-mono text-brand/70 mt-1">
                      <span className="text-ink-muted/60">run with </span>{l.tool}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* user path */}
        <Section title="Deal-team user journey (U1–U9)">
          <Intro k="journey" />
          {/* Column headers: the middle column is an API endpoint or screen file, which reads as
              noise unless it is labelled. */}
          <div className="hidden sm:flex items-center gap-3 px-2.5 pb-1.5 text-[9px] font-mono uppercase tracking-[0.14em] text-ink-muted/50">
            <span className="w-7 shrink-0">step</span>
            <span className="w-40 shrink-0">what the user does</span>
            <span className="w-52 shrink-0">screen / API endpoint</span>
            <span className="min-w-0">why it matters</span>
          </div>
          <div className="space-y-1.5">
            {userPath.map((u) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                <span className="text-[10px] font-mono font-bold text-brand w-7 shrink-0">{u.id}</span>
                <span className="text-[13px] font-semibold text-ink w-full sm:w-40 sm:shrink-0">{u.step}</span>
                <span className="text-[10px] font-mono text-teal w-full sm:w-52 sm:shrink-0 sm:truncate" title={u.where}>{u.where}</span>
                <span className="text-[11px] text-ink-muted min-w-0">{u.note}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* test cases by stage */}
        {testGroups.length > 0 && <Section title="Automated engine checks"><Intro k="cases" /></Section>}
        {testGroups.map((g) => (
          <Section key={g.stage} title={g.stage}>
            <div className="space-y-1.5">
              {g.cases.map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                  <span className="text-[10px] font-mono font-bold text-brand w-12 shrink-0">{c.id}</span>
                  <span className="text-[12px] text-ink min-w-0 flex-1">{c.assert}</span>
                  {/* E-numbers point at the edge cases in the Simulated Data view that prove this
                      assertion — meaningless as bare chips, so say what they are. */}
                  {c.edges.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 justify-end shrink-0 max-w-[34%]">
                      <span className="text-[9px] font-mono text-ink-muted/60">proven by</span>
                      {c.edges.map((e) => (
                        <span key={e} title="Edge case in the Simulated Data view"
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet/15 text-violet border border-violet/30">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        ))}

        {/* §4 Manual test plan + UAT */}
        <Section title="Manual test plan (human-run)">
          <Intro k="manual" />
          <ManualCases onCaseIds={handleCaseIds} />

          <div className="mt-3 p-3 rounded-lg bg-amber/5 border border-amber/20">
            <p className="text-[10px] font-mono font-semibold text-amber mb-1">UAT — acceptance sign-off</p>
            <p className="text-[11px] text-ink-muted">{uat.note}</p>
            <p className="text-[11px] text-ink mt-1"><span className="text-amber">Exit:</span> {uat.exit}</p>
          </div>
        </Section>

        {/* Run log + findings — where a tester records what actually happened. Editable: the
            view is already behind a login and signups are disabled, so everyone here is a tester. */}
        <Section title="Test results — run log & findings">
          <p className="text-[11px] text-ink-muted mb-3 max-w-3xl leading-relaxed">
            The cases above say what <span className="text-ink">should</span> happen. This is where a
            tester records what <span className="text-ink">did</span> — one row per case per run, plus
            any defects found. Everything you add here is shared with everyone who can sign in.
          </p>
          <TestRunLog caseIds={caseIds} />
        </Section>

        {/* §5 Frontend E2E design */}
        <Section title="Frontend E2E automation (Playwright)">
          <Intro k="e2e" />
          <div className="flex items-center gap-2 mb-2">
            <MonitorPlay className="w-3.5 h-3.5 text-violet" strokeWidth={2.25} />
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet/15 text-violet border border-violet/30">DESIGN ONLY — no test code yet</span>
          </div>
          <div className="space-y-1.5">
            {e2eFlows.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface border border-hairline">
                <span className="text-[10px] font-mono font-bold text-violet w-14 shrink-0">{e.id}</span>
                <span className="text-[12px] text-ink min-w-0 flex-1">{e.flow}</span>
                <span className="text-[9px] font-mono text-ink-muted shrink-0">
                  <span className="text-ink-muted/50">covers </span>{e.covers}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* §6 Non-functional */}
        <Section title="Non-functional testing">
          <Intro k="nonfunc" />
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
