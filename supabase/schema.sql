-- Compass Journey Map — Supabase schema (idempotent)
-- Run the full script in Supabase SQL Editor (safe to re-run)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  journey_id text unique not null,
  name text,
  saved_by text,
  viewport jsonb not null default '{"x":0,"y":0,"zoom":1}'::jsonb,
  edge_style text not null default 'smoothstep',
  mermaid_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nodes (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  rf_id text not null,
  type text not null,
  position_x double precision not null,
  position_y double precision not null,
  width double precision,
  height double precision,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (board_id, rf_id)
);

create table if not exists public.edges (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  rf_id text not null,
  source_id text not null,
  target_id text not null,
  type text not null default 'smoothstep',
  label text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (board_id, rf_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  client_id text,
  x double precision not null,
  y double precision not null,
  thread jsonb not null default '{"replies":[]}'::jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  client_id text,
  type text not null default 'pencil',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Migrations for existing projects
alter table public.comments add column if not exists client_id text;
alter table public.comments add column if not exists updated_at timestamptz not null default now();
alter table public.annotations add column if not exists client_id text;
alter table public.boards add column if not exists mermaid_source text;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_nodes_board on public.nodes (board_id);
create index if not exists idx_edges_board on public.edges (board_id);
create index if not exists idx_comments_board on public.comments (board_id);
create index if not exists idx_annotations_board on public.annotations (board_id);

-- Upsert support: one row per (board, client thread id)
drop index if exists idx_comments_board_client;
alter table public.comments drop constraint if exists comments_board_client_key;
alter table public.comments add constraint comments_board_client_key unique (board_id, client_id);

drop index if exists idx_annotations_board_client;
alter table public.annotations drop constraint if exists annotations_board_client_key;
alter table public.annotations add constraint annotations_board_client_key unique (board_id, client_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists boards_set_updated_at on public.boards;
create trigger boards_set_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security (open for guest collab — tighten when auth is added)
-- ---------------------------------------------------------------------------

alter table public.boards enable row level security;
alter table public.nodes enable row level security;
alter table public.edges enable row level security;
alter table public.comments enable row level security;
alter table public.annotations enable row level security;

drop policy if exists "boards_all" on public.boards;
create policy "boards_all" on public.boards for all to anon, authenticated using (true) with check (true);

drop policy if exists "nodes_all" on public.nodes;
create policy "nodes_all" on public.nodes for all to anon, authenticated using (true) with check (true);

drop policy if exists "edges_all" on public.edges;
create policy "edges_all" on public.edges for all to anon, authenticated using (true) with check (true);

drop policy if exists "comments_all" on public.comments;
create policy "comments_all" on public.comments for all to anon, authenticated using (true) with check (true);

drop policy if exists "annotations_all" on public.annotations;
create policy "annotations_all" on public.annotations for all to anon, authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Grants (required for anon key / REST API)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.boards to anon, authenticated;
grant select, insert, update, delete on public.nodes to anon, authenticated;
grant select, insert, update, delete on public.edges to anon, authenticated;
grant select, insert, update, delete on public.comments to anon, authenticated;
grant select, insert, update, delete on public.annotations to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Workspace presence (cross-browser roster — heartbeat + Realtime CDC)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Realtime (ignore if already added)
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.boards;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.nodes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.edges;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.annotations;
exception when duplicate_object then null;
end $$;
