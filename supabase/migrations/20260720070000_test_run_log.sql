-- Run Log + Findings: where a tester records what actually happened.
--
-- The plan said what SHOULD happen but had nowhere to record what DID. A tester ran M-1..M-13 and
-- the result lived in their head. This adds the two tables the team's standard format expects.
--
-- Access: authenticated only, matching the Test Plan view that already sits behind a login. Signups
-- are disabled and only invited users exist, so "authenticated" is the intended tester group.
-- anon gets nothing — a client with the link can neither read nor write results.

create table if not exists public.test_run_log (
  id          uuid primary key default gen_random_uuid(),
  case_id     text not null,                       -- M-1 .. M-13
  run_date    date not null default current_date,
  tester      text not null,
  build       text,                                -- branch / commit under test
  result      text not null check (result in ('Pass','Fail','Blocked','Skipped')),
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.test_findings (
  id          uuid primary key default gen_random_uuid(),
  case_id     text,                                -- which case surfaced it (may be exploratory)
  raised_on   date not null default current_date,
  raised_by   text not null,
  severity    text not null check (severity in ('Critical','High','Medium','Low')),
  summary     text not null,
  detail      text,
  status      text not null default 'Open' check (status in ('Open','In progress','Fixed','Won''t fix')),
  created_at  timestamptz not null default now()
);

alter table public.test_run_log  enable row level security;
alter table public.test_findings enable row level security;

drop policy if exists "run_log_rw_authenticated" on public.test_run_log;
create policy "run_log_rw_authenticated" on public.test_run_log
  for all to authenticated using (true) with check (true);

drop policy if exists "findings_rw_authenticated" on public.test_findings;
create policy "findings_rw_authenticated" on public.test_findings
  for all to authenticated using (true) with check (true);

grant select, insert, update on public.test_run_log  to authenticated;
grant select, insert, update on public.test_findings to authenticated;
revoke all on public.test_run_log  from anon;
revoke all on public.test_findings from anon;

create index if not exists ix_run_log_case  on public.test_run_log (case_id, run_date desc);
create index if not exists ix_findings_open on public.test_findings (status, severity);
