-- Cross-browser presence roster (run in Supabase SQL Editor if not using CLI)
create table if not exists public.workspace_presence (
  session_id text primary key,
  name text not null default 'Guest',
  color text,
  journey_id text,
  journey_title text,
  mode text default 'view',
  following text,
  last_seen timestamptz not null default now()
);

alter table public.workspace_presence enable row level security;

drop policy if exists "workspace_presence_all" on public.workspace_presence;
create policy "workspace_presence_all" on public.workspace_presence
  for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.workspace_presence to anon, authenticated;

create index if not exists idx_workspace_presence_last_seen on public.workspace_presence (last_seen);

do $$
begin
  alter publication supabase_realtime add table public.workspace_presence;
exception when duplicate_object then null;
end $$;
