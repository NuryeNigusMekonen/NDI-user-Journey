-- Manual test cases become live rows instead of authored JSONB.
--
-- Until now the 13 cases lived in protected_content.payload->'manualCases', so changing one meant
-- writing a migration. Testers need to add a case the moment they find a gap, so this moves them
-- into their own table alongside test_run_log / test_findings.
--
-- Trade-off, stated plainly: the plan stops being version-controlled. A deleted case leaves no
-- trace in git — the .xlsx export is the only durable record. That is the cost of editability.
--
-- Access mirrors the run log exactly: authenticated only, anon revoked. The Test Plan view already
-- sits behind a login and signups are disabled, so "authenticated" is the tester group.

create table if not exists public.test_manual_cases (
  id          uuid primary key default gen_random_uuid(),
  case_id     text not null,                     -- M-1 .. M-13, author-assigned so it can be reordered
  area        text not null,                     -- Auth | Upload | Review | Output | Access | Reference
  title       text not null,                     -- the "Test Case" column
  steps       text,                              -- numbered sequence on one line, per the standard
  expected    text not null,
  priority    text not null default 'Medium' check (priority in ('High','Medium','Low')),
  sort_order  integer not null default 0,        -- keeps M-2 above M-10 without relying on text sort
  created_at  timestamptz not null default now()
);

alter table public.test_manual_cases enable row level security;

drop policy if exists "manual_cases_rw_authenticated" on public.test_manual_cases;
create policy "manual_cases_rw_authenticated" on public.test_manual_cases
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.test_manual_cases to authenticated;
revoke all on public.test_manual_cases from anon;

create index if not exists ix_manual_cases_order on public.test_manual_cases (sort_order);

-- Seed from the 13 cases currently in protected_content, verbatim. Guarded so re-running the
-- migration cannot duplicate them or clobber edits a tester has already made.
insert into public.test_manual_cases (case_id, area, title, steps, expected, priority, sort_order)
select * from (values
 ('M-1','Auth','Login fail-closed',
  '1) Point the app at a database with no users 2) Open the login page 3) Attempt to sign in with any credentials',
  'Access denied. No default or fallback account exists — an empty user table admits nobody.','High',1),
 ('M-2','Upload','Upload and verbatim preview',
  '1) Sign in 2) Upload clean_baseline.xlsx 3) Compare the preview against the source workbook',
  'Every one of the 59 columns appears exactly as written in the file — nothing normalized, renamed or dropped.','High',2),
 ('M-3','Review','Flagged rows are visible and readable',
  '1) Upload edge_ingestion.xlsx 2) Open the review screen 3) Read the reason on each flagged row',
  'Every flagged and rejected row is listed with a reason a non-engineer can act on. The blank-Code row appears — it is never silently dropped.','High',3),
 ('M-4','Review','Correction flow',
  '1) On a flagged row, correct the field 2) Save 3) Re-open the record 4) Run the analysis',
  'The correction persists, is written to the audit log, and the record re-derives. Snapshot status moves review to final only on run.','High',4),
 ('M-5','Output','Verdict readability',
  '1) Run all_combined.xlsx 2) Open the result 3) Read it as a deal-team member would',
  'Remediation (A+B) and the per-plan healthcare pass/fail are clearly labelled and unambiguous — a reader can tell what the number means without asking.','High',5),
 ('M-6','Output','Export into the acquisition model',
  '1) Open a completed run 2) Export 3) Paste into the acquisition model',
  'The structured output pastes cleanly, with columns landing where the model expects them.','Medium',6),
 ('M-7','Output','Degraded run is visible',
  '1) Run edge_geo.xlsx, which contains an uncovered county 2) Open the result',
  'The UI shows the run as degraded. It never presents a partial basket as a full-confidence number.','High',7),
 ('M-8','Access','ADVISOR run isolation',
  '1) Sign in as ADVISOR A and run a census 2) Sign in as ADVISOR B 3) Look for A''s run',
  'B cannot see A''s run in any list, and cannot open it by URL.','High',8),
 ('M-9','Access','ADMIN full visibility',
  '1) Sign in as ADMIN 2) Open the runs list',
  'Every run is visible regardless of owner, including legacy runs.','Medium',9),
 ('M-10','Access','Owner-only share management',
  '1) As the owner, share a run with another user 2) Sign in as that user 3) Attempt to add or remove a share',
  'The recipient can view the run but cannot change who else it is shared with.','High',10),
 ('M-11','Auth','Invite and password-reset flows',
  '1) As ADMIN, invite a user 2) Accept via the invite link 3) Request a password reset 4) Re-use the old link',
  'Invite and reset links work once and then expire. An expired link fails with a clear message.','Medium',11),
 ('M-12','Reference','Reference data screen',
  '1) Open the reference screen 2) Pick a basket component 3) Compare it against the published source',
  'Every external ruler (MIT, EPI, OEWS, PSL statutes, healthcare benchmarks) is shown as loaded, so a number can be checked against its source.','Medium',12),
 ('M-13','Reference','Methodology versioning',
  '1) Note the current methodology version 2) Change a global default 3) Run an analysis 4) Check the version on the run',
  'A NEW immutable methodology version is frozen. The run records the version it used — the old snapshot is never silently reused.','High',13)
) as seed(case_id, area, title, steps, expected, priority, sort_order)
where not exists (select 1 from public.test_manual_cases);
