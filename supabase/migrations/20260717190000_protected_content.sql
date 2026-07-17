-- Protected content for the Test Plan + Simulated Data views.
-- KEY SECURITY DIFFERENCE vs the other tables: RLS grants read to `authenticated` ONLY,
-- never `anon`. The anon key (shipped in the bundle) can NOT read these rows, so the
-- test/dataset content never reaches an unauthenticated client's browser.
--
-- Run this in the Supabase SQL Editor (project voyawvckqitjqtfserwo), then insert the
-- content rows (see 20260717190100_protected_content_data.sql).

create table if not exists public.protected_content (
  key         text primary key,          -- 'test_plan' | 'dataset_catalog'
  payload     jsonb not null,            -- the view's data (matches the old tests.js / datasets.js shapes)
  updated_at  timestamptz not null default now()
);

alter table public.protected_content enable row level security;

-- Read ONLY for authenticated users. No anon policy => anon (the public bundle key) is denied.
drop policy if exists "protected_content_read_authenticated" on public.protected_content;
create policy "protected_content_read_authenticated"
  on public.protected_content
  for select
  to authenticated
  using (true);

-- Grants: authenticated may read; anon gets nothing.
grant select on public.protected_content to authenticated;
revoke all on public.protected_content from anon;
