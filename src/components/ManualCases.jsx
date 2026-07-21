import { useCallback, useEffect, useState } from 'react';
import { Plus, Loader2, RefreshCw, Pencil, Trash2, Check, X, Download,
  ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PRIORITIES = ['High', 'Medium', 'Low'];
// App-behaviour areas plus the three engines: rule-verification cases (M-14+) check a NUMBER
// against the Technical Brief, which is a different kind of testing from "does the screen work".
// A value missing here renders as a blank select when the row is edited.
const AREAS = ['Auth', 'Upload', 'Review', 'Output', 'Access', 'Reference',
  'Engine A', 'Engine B', 'Engine C', 'Pipeline'];

const PRI_CLS = {
  High: 'text-amber bg-amber/10 border-amber/30',
  Medium: 'text-brand bg-brand/10 border-brand/30',
  Low: 'text-slate bg-slate/10 border-slate/30',
};

const input = 'px-2 py-1 rounded bg-surface border border-hairline text-[11px] text-ink ' +
  'placeholder:text-ink-muted/50 focus:outline-none focus:border-brand/50';
const cellInput = 'w-full px-1 py-0.5 rounded bg-canvas border border-brand/40 text-[10px] ' +
  'text-ink focus:outline-none';

const COLS = [
  { key: 'case_id', label: 'ID' }, { key: 'area', label: 'Area' },
  { key: 'title', label: 'Test Case' }, { key: 'steps', label: 'Steps' },
  { key: 'expected', label: 'Expected Result' }, { key: 'priority', label: 'Priority' },
];

/** Export the plan as .xlsx — same shape as the run-log export, so a reviewer gets the cases and
 *  the results in the same format. Lazily imported: the writer only downloads on click.
 *
 *  This is also the only durable record of the plan. Cases are live rows now, so a deleted case
 *  leaves no trace in git. */
async function downloadCases(rows) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const wide = ['steps', 'expected', 'title'];
  await writeXlsxFile([{
    data: [
      COLS.map((c) => ({ value: c.label, fontWeight: 'bold' })),
      ...rows.map((r) => COLS.map((c) => ({ value: r[c.key] ?? '', type: String }))),
    ],
    sheet: 'Manual Test Plan',
    columns: COLS.map((c) => ({ width: wide.includes(c.key) ? 52 : 14 })),
  }]).toFile(`nine-dean-manual-test-plan-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

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
 * The manual test plan as live, editable rows (Compass format: ID | Area | Test Case | Steps |
 * Expected Result | Priority). Previously authored JSONB, so adding a case meant a migration.
 *
 * `onCaseIds` lifts the case list to the parent so the Run Log's case dropdown stays in sync with
 * whatever is actually in the plan — add M-14 here and it is immediately loggable.
 */
export default function ManualCases({ onCaseIds, collapsedRows = 8 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [confirming, setConfirming] = useState(null);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const blank = { case_id: '', area: 'Upload', title: '', steps: '', expected: '', priority: 'High' };
  const [next, setNext] = useState(blank);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    const { data, error } = await supabase.from('test_manual_cases')
      .select('*').order('sort_order', { ascending: true });
    if (error) setErr('Could not load the manual cases — has the migration been run?');
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep the parent's case dropdown in step with the plan.
  useEffect(() => { onCaseIds?.(rows.map((r) => r.case_id)); }, [rows, onCaseIds]);

  const add = async (e) => {
    e.preventDefault();
    if (!next.case_id || !next.title || !next.expected) return;
    setSaving(true);
    // Append: put the new case after the current last, so ordering stays intentional.
    const sort_order = rows.length ? Math.max(...rows.map((r) => r.sort_order || 0)) + 1 : 1;
    const { error } = await supabase.from('test_manual_cases').insert({ ...next, sort_order });
    setSaving(false);
    if (error) return setErr(error.message);
    setNext(blank); setAdding(false); load();
  };

  const saveEdit = async () => {
    setSaving(true);
    const { id, ...rest } = draft;
    const { error } = await supabase.from('test_manual_cases').update(rest).eq('id', id);
    setSaving(false);
    if (error) return setErr(error.message);
    setEditing(null); setDraft({}); load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from('test_manual_cases').delete().eq('id', id);
    if (error) return setErr(error.message);
    setConfirming(null); load();
  };

  const clear = () => { setEditing(null); setConfirming(null); setDraft({}); };

  if (loading) {
    return <p className="text-[11px] text-ink-muted flex items-center gap-2">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading cases…
    </p>;
  }

  const visible = expanded ? rows : rows.slice(0, collapsedRows);

  const TH = ({ children, w }) => (
    <th className={`text-left px-2 py-1.5 font-semibold uppercase tracking-wider ${w || ''}`}>{children}</th>
  );
  const Cell = ({ ed, k, children, cls }) => (
    <td className={`px-2 py-1.5 align-top ${cls || ''}`}>
      {ed ? <textarea rows={3} className={cellInput} value={draft[k] || ''}
        onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} /> : children}
    </td>
  );

  return (
    <div>
      {err && <p className="text-[11px] text-amber p-2 rounded bg-amber/5 border border-amber/20 mb-2">{err}</p>}

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono text-ink-muted">
          run by a tester on staging — automation can’t judge these
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <button onClick={() => downloadCases(rows)} disabled={!rows.length}
            title="Download the plan as an Excel workbook"
            className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-brand/40 text-brand hover:bg-brand/10 transition-colors disabled:opacity-40">
            <Download className="w-3 h-3" /> .xlsx
          </button>
          <button onClick={() => setAdding((v) => !v)} title="Add a case"
            className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border border-brand/40 text-brand hover:bg-brand/10 transition-colors">
            <Plus className="w-3 h-3" /> case
          </button>
          <button onClick={load} className="text-ink-muted hover:text-brand" title="Refresh">
            <RefreshCw className="w-3 h-3" />
          </button>
        </span>
      </div>

      {adding && (
        <form onSubmit={add} className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-lg bg-surface border border-brand/25">
          <input className={`${input} w-20`} placeholder="M-14" value={next.case_id} required
            onChange={(e) => setNext({ ...next, case_id: e.target.value })} />
          <select className={input} value={next.area} onChange={(e) => setNext({ ...next, area: e.target.value })}>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input className={`${input} w-48`} placeholder="test case" value={next.title} required
            onChange={(e) => setNext({ ...next, title: e.target.value })} />
          <select className={input} value={next.priority} onChange={(e) => setNext({ ...next, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input className={`${input} flex-1 min-w-[200px]`} placeholder="steps — 1) … 2) …" value={next.steps}
            onChange={(e) => setNext({ ...next, steps: e.target.value })} />
          <input className={`${input} flex-1 min-w-[200px]`} placeholder="expected result" value={next.expected} required
            onChange={(e) => setNext({ ...next, expected: e.target.value })} />
          <button type="submit" disabled={saving}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-brand text-canvas font-semibold hover:bg-brand-dark disabled:opacity-60">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} add
          </button>
        </form>
      )}

      {rows.length === 0
        ? <p className="text-[11px] text-ink-muted/60">No cases yet.</p>
        : (
          <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
            <table className="w-full text-[10px] font-mono">
              <thead><tr className="border-b border-hairline text-ink-muted/60">
                <TH w="w-14">id</TH><TH w="w-20">area</TH><TH w="w-44">test case</TH>
                <TH>steps</TH><TH>expected result</TH><TH w="w-16">pri</TH><TH w="w-14" />
              </tr></thead>
              <tbody>
                {visible.map((r) => {
                  const ed = editing === r.id;
                  return (
                    <tr key={r.id} className="group border-b border-hairline/40 last:border-0 align-top">
                      <td className="px-2 py-1.5 text-brand font-bold align-top">{r.case_id}</td>
                      <td className="px-2 py-1.5 align-top">
                        {ed
                          ? <select className={cellInput} value={draft.area}
                              onChange={(e) => setDraft({ ...draft, area: e.target.value })}>
                              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                          : <span className="text-ink-muted">{r.area}</span>}
                      </td>
                      <Cell ed={ed} k="title" cls="text-ink font-semibold whitespace-normal">{r.title}</Cell>
                      <Cell ed={ed} k="steps" cls="text-ink-muted whitespace-normal min-w-[200px]">{r.steps || '·'}</Cell>
                      <Cell ed={ed} k="expected" cls="text-teal/85 whitespace-normal min-w-[200px]">{r.expected}</Cell>
                      <td className="px-2 py-1.5 align-top">
                        {ed
                          ? <select className={cellInput} value={draft.priority}
                              onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
                              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          : <span className={`px-1.5 py-0.5 rounded border ${PRI_CLS[r.priority]}`}>{r.priority}</span>}
                      </td>
                      <td className="px-2 py-1.5 w-14 align-top">
                        <RowActions
                          editing={ed}
                          confirming={confirming === r.id}
                          saving={saving}
                          onEdit={() => { setConfirming(null); setEditing(r.id); setDraft(r); }}
                          onSave={saveEdit}
                          onDelete={() => remove(r.id)}
                          onCancel={() => (ed || confirming === r.id) ? clear() : setConfirming(r.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > collapsedRows && (
              <button onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-[9px] font-mono
                  text-ink-muted hover:text-brand border-t border-hairline/60 transition-colors">
                {expanded
                  ? <><ChevronUp className="w-3 h-3" /> show fewer</>
                  : <><ChevronDown className="w-3 h-3" /> show all {rows.length} — {rows.length - visible.length} hidden</>}
              </button>
            )}
          </div>
        )}
    </div>
  );
}
