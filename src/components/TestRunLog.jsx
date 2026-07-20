import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, Bug, Plus, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const RESULTS = ['Pass', 'Fail', 'Blocked', 'Skipped'];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In progress', 'Fixed', "Won't fix"];

const RESULT_CLS = {
  Pass: 'text-teal bg-teal/10 border-teal/30',
  Fail: 'text-amber bg-amber/15 border-amber/40',
  Blocked: 'text-violet bg-violet/10 border-violet/30',
  Skipped: 'text-slate bg-slate/10 border-slate/30',
};
const SEV_CLS = {
  Critical: 'text-amber bg-amber/20 border-amber/50',
  High: 'text-amber bg-amber/10 border-amber/30',
  Medium: 'text-brand bg-brand/10 border-brand/30',
  Low: 'text-slate bg-slate/10 border-slate/30',
};

const input = 'px-2 py-1 rounded bg-surface border border-hairline text-[11px] text-ink ' +
  'placeholder:text-ink-muted/50 focus:outline-none focus:border-brand/50';

/**
 * Run Log + Findings — the half of a test plan that records what ACTUALLY happened.
 * Writes are authenticated-only (see the migration); the view already sits behind a login, and
 * signups are disabled, so everyone who can reach this is an invited tester.
 */
export default function TestRunLog({ caseIds = [], tester }) {
  const [runs, setRuns] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const blankRun = { case_id: caseIds[0] || '', tester: tester || '', build: '', result: 'Pass', notes: '' };
  const blankFinding = { case_id: '', raised_by: tester || '', severity: 'High', summary: '', status: 'Open' };
  const [run, setRun] = useState(blankRun);
  const [finding, setFinding] = useState(blankFinding);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    const [r, f] = await Promise.all([
      supabase.from('test_run_log').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('test_findings').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (r.error || f.error) setErr('Could not load results — has the migration been run?');
    setRuns(r.data || []); setFindings(f.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addRun = async (e) => {
    e.preventDefault();
    if (!run.case_id || !run.tester) return;
    setSaving(true);
    const { error } = await supabase.from('test_run_log').insert(run);
    setSaving(false);
    if (error) return setErr(error.message);
    setRun({ ...blankRun, tester: run.tester, build: run.build });
    load();
  };

  const addFinding = async (e) => {
    e.preventDefault();
    if (!finding.summary || !finding.raised_by) return;
    setSaving(true);
    const { error } = await supabase.from('test_findings').insert(finding);
    setSaving(false);
    if (error) return setErr(error.message);
    setFinding({ ...blankFinding, raised_by: finding.raised_by });
    load();
  };

  const setStatus = async (id, status) => {
    await supabase.from('test_findings').update({ status }).eq('id', id);
    load();
  };

  if (loading) {
    return <p className="text-[11px] text-ink-muted flex items-center gap-2">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading results…
    </p>;
  }

  return (
    <div className="space-y-6">
      {err && <p className="text-[11px] text-amber p-2 rounded bg-amber/5 border border-amber/20">{err}</p>}

      {/* ---------------- Run Log ---------------- */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardCheck className="w-3.5 h-3.5 text-teal" strokeWidth={2.25} />
          <span className="text-[10px] font-mono font-semibold tracking-[0.14em] uppercase text-teal/80">
            Run log — one row per case, per run
          </span>
          <button onClick={load} className="ml-auto text-ink-muted hover:text-brand" title="Refresh">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <form onSubmit={addRun} className="flex flex-wrap gap-1.5 mb-2">
          <select value={run.case_id} onChange={(e) => setRun({ ...run, case_id: e.target.value })} className={input}>
            {caseIds.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className={`${input} w-28`} placeholder="tester" value={run.tester}
            onChange={(e) => setRun({ ...run, tester: e.target.value })} required />
          <input className={`${input} w-32`} placeholder="build / branch" value={run.build}
            onChange={(e) => setRun({ ...run, build: e.target.value })} />
          <select value={run.result} onChange={(e) => setRun({ ...run, result: e.target.value })} className={input}>
            {RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input className={`${input} flex-1 min-w-[160px]`} placeholder="notes" value={run.notes}
            onChange={(e) => setRun({ ...run, notes: e.target.value })} />
          <button type="submit" disabled={saving}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-brand text-canvas font-semibold hover:bg-brand-dark disabled:opacity-60">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} log
          </button>
        </form>

        {runs.length === 0
          ? <p className="text-[11px] text-ink-muted/60">No runs recorded yet.</p>
          : (
            <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
              <table className="w-full text-[10px] font-mono">
                <thead><tr className="border-b border-hairline text-ink-muted/60">
                  {['date', 'case', 'tester', 'build', 'result', 'notes'].map((h) => (
                    <th key={h} className="text-left px-2 py-1.5 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-b border-hairline/40 last:border-0">
                      <td className="px-2 py-1 text-ink-muted">{r.run_date}</td>
                      <td className="px-2 py-1 text-brand font-bold">{r.case_id}</td>
                      <td className="px-2 py-1 text-ink">{r.tester}</td>
                      <td className="px-2 py-1 text-ink-muted">{r.build || '·'}</td>
                      <td className="px-2 py-1">
                        <span className={`px-1.5 py-0.5 rounded border ${RESULT_CLS[r.result]}`}>{r.result}</span>
                      </td>
                      <td className="px-2 py-1 text-ink-muted whitespace-normal min-w-[180px]">{r.notes || '·'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* ---------------- Findings ---------------- */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Bug className="w-3.5 h-3.5 text-amber" strokeWidth={2.25} />
          <span className="text-[10px] font-mono font-semibold tracking-[0.14em] uppercase text-amber/80">
            Findings — defects raised during testing
          </span>
        </div>

        <form onSubmit={addFinding} className="flex flex-wrap gap-1.5 mb-2">
          <input className={`${input} w-20`} placeholder="case" value={finding.case_id}
            onChange={(e) => setFinding({ ...finding, case_id: e.target.value })} />
          <input className={`${input} w-28`} placeholder="raised by" value={finding.raised_by}
            onChange={(e) => setFinding({ ...finding, raised_by: e.target.value })} required />
          <select value={finding.severity} onChange={(e) => setFinding({ ...finding, severity: e.target.value })} className={input}>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className={`${input} flex-1 min-w-[200px]`} placeholder="what went wrong" value={finding.summary}
            onChange={(e) => setFinding({ ...finding, summary: e.target.value })} required />
          <button type="submit" disabled={saving}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-amber/90 text-canvas font-semibold hover:bg-amber disabled:opacity-60">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} raise
          </button>
        </form>

        {findings.length === 0
          ? <p className="text-[11px] text-ink-muted/60">No findings raised.</p>
          : (
            <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
              <table className="w-full text-[10px] font-mono">
                <thead><tr className="border-b border-hairline text-ink-muted/60">
                  {['raised', 'case', 'by', 'severity', 'summary', 'status'].map((h) => (
                    <th key={h} className="text-left px-2 py-1.5 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {findings.map((f) => (
                    <tr key={f.id} className="border-b border-hairline/40 last:border-0">
                      <td className="px-2 py-1 text-ink-muted">{f.raised_on}</td>
                      <td className="px-2 py-1 text-brand font-bold">{f.case_id || '·'}</td>
                      <td className="px-2 py-1 text-ink">{f.raised_by}</td>
                      <td className="px-2 py-1">
                        <span className={`px-1.5 py-0.5 rounded border ${SEV_CLS[f.severity]}`}>{f.severity}</span>
                      </td>
                      <td className="px-2 py-1 text-ink whitespace-normal min-w-[220px]">{f.summary}</td>
                      <td className="px-2 py-1">
                        <select value={f.status} onChange={(e) => setStatus(f.id, e.target.value)}
                          className="bg-transparent border border-hairline rounded px-1 py-0.5 text-ink-muted focus:outline-none focus:border-brand/50">
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
