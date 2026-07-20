import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, Bug, Plus, Loader2, RefreshCw, Pencil, Trash2, Check, X, Download } from 'lucide-react';
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
const cellInput = 'w-full px-1 py-0.5 rounded bg-canvas border border-brand/40 text-[10px] ' +
  'text-ink focus:outline-none';


/** Export rows as CSV. Testers need the log in a spreadsheet for reporting and sign-off, and a
 *  file is also the only backup if a row is deleted. Quotes are doubled per RFC 4180. */
function downloadCsv(filename, columns, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [columns.join(','), ...rows.map((r) => columns.map((c) => esc(r[c])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function CsvButton({ onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} title="Download as CSV"
      className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-hairline text-ink-muted hover:text-brand hover:border-brand/40 transition-colors disabled:opacity-40">
      <Download className="w-3 h-3" /> csv
    </button>
  );
}

/** Edit / delete controls. Delete confirms first — the log is shared, so a misclick would
 *  destroy someone else's recorded result. */
function RowActions({ editing, onEdit, onSave, onCancel, onDelete, confirming, saving }) {
  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={onSave} disabled={saving} title="Save"
          className="text-teal hover:text-teal/70 disabled:opacity-50">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onCancel} title="Cancel" className="text-ink-muted hover:text-ink">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={onDelete} className="text-[9px] font-mono text-amber hover:underline">delete?</button>
        <button onClick={onCancel} title="Keep" className="text-ink-muted hover:text-ink">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
      <button onClick={onEdit} title="Edit" className="text-ink-muted hover:text-brand">
        <Pencil className="w-3 h-3" />
      </button>
      <button onClick={onCancel} title="Delete" className="text-ink-muted hover:text-amber">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

/**
 * Run Log + Findings — the half of a test plan that records what ACTUALLY happened.
 * Rows are editable and deletable in place. Writes are authenticated-only (see the migration);
 * the view already sits behind a login and signups are disabled, so everyone here is a tester.
 */
export default function TestRunLog({ caseIds = [] }) {
  const [runs, setRuns] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);   // { table, id }
  const [draft, setDraft] = useState({});
  const [confirming, setConfirming] = useState(null);

  const blankRun = { case_id: caseIds[0] || '', tester: '', build: '', result: 'Pass', notes: '' };
  const blankFinding = { case_id: '', raised_by: '', severity: 'High', summary: '', status: 'Open' };
  const [run, setRun] = useState(blankRun);
  const [finding, setFinding] = useState(blankFinding);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    const [r, f] = await Promise.all([
      supabase.from('test_run_log').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('test_findings').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (r.error || f.error) setErr('Could not load results — has the migration been run?');
    setRuns(r.data || []); setFindings(f.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (table, row, reset) => {
    setSaving(true);
    const { error } = await supabase.from(table).insert(row);
    setSaving(false);
    if (error) return setErr(error.message);
    reset(); load();
  };

  const saveEdit = async (table) => {
    setSaving(true);
    const { id, ...rest } = draft;
    const { error } = await supabase.from(table).update(rest).eq('id', id);
    setSaving(false);
    if (error) return setErr(error.message);
    setEditing(null); setDraft({}); load();
  };

  const remove = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return setErr(error.message);
    setConfirming(null); load();
  };

  const isEditing = (t, id) => editing?.table === t && editing?.id === id;
  const startEdit = (t, row) => { setConfirming(null); setEditing({ table: t, id: row.id }); setDraft(row); };
  const clear = () => { setEditing(null); setConfirming(null); setDraft({}); };

  if (loading) {
    return <p className="text-[11px] text-ink-muted flex items-center gap-2">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading results…
    </p>;
  }

  const TH = ({ children }) => (
    <th className="text-left px-2 py-1.5 font-semibold uppercase tracking-wider">{children}</th>
  );

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
          <span className="ml-auto flex items-center gap-1.5">
            <CsvButton disabled={!runs.length} onClick={() => downloadCsv('test-run-log.csv',
              ['run_date', 'case_id', 'tester', 'build', 'result', 'notes'], runs)} />
            <button onClick={load} className="text-ink-muted hover:text-brand" title="Refresh">
              <RefreshCw className="w-3 h-3" />
            </button>
          </span>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (run.case_id && run.tester) add('test_run_log', run, () => setRun({ ...blankRun, tester: run.tester, build: run.build })); }}
          className="flex flex-wrap gap-1.5 mb-2">
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
                  <TH>date</TH><TH>case</TH><TH>tester</TH><TH>build</TH><TH>result</TH><TH>notes</TH><TH></TH>
                </tr></thead>
                <tbody>
                  {runs.map((r) => {
                    const ed = isEditing('test_run_log', r.id);
                    return (
                      <tr key={r.id} className="group border-b border-hairline/40 last:border-0">
                        <td className="px-2 py-1 text-ink-muted">{r.run_date}</td>
                        <td className="px-2 py-1 text-brand font-bold">{r.case_id}</td>
                        <td className="px-2 py-1 text-ink">
                          {ed ? <input className={cellInput} value={draft.tester || ''}
                            onChange={(e) => setDraft({ ...draft, tester: e.target.value })} /> : r.tester}
                        </td>
                        <td className="px-2 py-1 text-ink-muted">
                          {ed ? <input className={cellInput} value={draft.build || ''}
                            onChange={(e) => setDraft({ ...draft, build: e.target.value })} /> : (r.build || '·')}
                        </td>
                        <td className="px-2 py-1">
                          {ed
                            ? <select className={cellInput} value={draft.result}
                                onChange={(e) => setDraft({ ...draft, result: e.target.value })}>
                                {RESULTS.map((x) => <option key={x} value={x}>{x}</option>)}
                              </select>
                            : <span className={`px-1.5 py-0.5 rounded border ${RESULT_CLS[r.result]}`}>{r.result}</span>}
                        </td>
                        <td className="px-2 py-1 text-ink-muted whitespace-normal min-w-[180px]">
                          {ed ? <input className={cellInput} value={draft.notes || ''}
                            onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /> : (r.notes || '·')}
                        </td>
                        <td className="px-2 py-1 w-14">
                          <RowActions
                            editing={ed}
                            confirming={confirming === r.id}
                            saving={saving}
                            onEdit={() => startEdit('test_run_log', r)}
                            onSave={() => saveEdit('test_run_log')}
                            onDelete={() => remove('test_run_log', r.id)}
                            onCancel={() => (ed || confirming === r.id) ? clear() : setConfirming(r.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
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
          <span className="ml-auto">
            <CsvButton disabled={!findings.length} onClick={() => downloadCsv('test-findings.csv',
              ['raised_on', 'case_id', 'raised_by', 'severity', 'summary', 'detail', 'status'], findings)} />
          </span>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (finding.summary && finding.raised_by) add('test_findings', finding, () => setFinding({ ...blankFinding, raised_by: finding.raised_by })); }}
          className="flex flex-wrap gap-1.5 mb-2">
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
                  <TH>raised</TH><TH>case</TH><TH>by</TH><TH>severity</TH><TH>summary</TH><TH>status</TH><TH></TH>
                </tr></thead>
                <tbody>
                  {findings.map((f) => {
                    const ed = isEditing('test_findings', f.id);
                    return (
                      <tr key={f.id} className="group border-b border-hairline/40 last:border-0">
                        <td className="px-2 py-1 text-ink-muted">{f.raised_on}</td>
                        <td className="px-2 py-1 text-brand font-bold">
                          {ed ? <input className={cellInput} value={draft.case_id || ''}
                            onChange={(e) => setDraft({ ...draft, case_id: e.target.value })} /> : (f.case_id || '·')}
                        </td>
                        <td className="px-2 py-1 text-ink">
                          {ed ? <input className={cellInput} value={draft.raised_by || ''}
                            onChange={(e) => setDraft({ ...draft, raised_by: e.target.value })} /> : f.raised_by}
                        </td>
                        <td className="px-2 py-1">
                          {ed
                            ? <select className={cellInput} value={draft.severity}
                                onChange={(e) => setDraft({ ...draft, severity: e.target.value })}>
                                {SEVERITIES.map((x) => <option key={x} value={x}>{x}</option>)}
                              </select>
                            : <span className={`px-1.5 py-0.5 rounded border ${SEV_CLS[f.severity]}`}>{f.severity}</span>}
                        </td>
                        <td className="px-2 py-1 text-ink whitespace-normal min-w-[220px]">
                          {ed ? <input className={cellInput} value={draft.summary || ''}
                            onChange={(e) => setDraft({ ...draft, summary: e.target.value })} /> : f.summary}
                        </td>
                        <td className="px-2 py-1">
                          <select value={f.status}
                            onChange={async (e) => { await supabase.from('test_findings').update({ status: e.target.value }).eq('id', f.id); load(); }}
                            className="bg-transparent border border-hairline rounded px-1 py-0.5 text-ink-muted focus:outline-none focus:border-brand/50">
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1 w-14">
                          <RowActions
                            editing={ed}
                            confirming={confirming === f.id}
                            saving={saving}
                            onEdit={() => startEdit('test_findings', f)}
                            onSave={() => saveEdit('test_findings')}
                            onDelete={() => remove('test_findings', f.id)}
                            onCancel={() => (ed || confirming === f.id) ? clear() : setConfirming(f.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
