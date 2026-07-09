-- AthletIQ — real auth (player side)
-- ---------------------------------------------------------------------------
-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- It does three things:
--   1. Adds a `profiles` table holding each user's role + name.
--   2. Adds an "ownerId" to players and sessions (which user the row belongs to),
--      defaulting to the logged-in user automatically.
--   3. Replaces the old demo-open security with OWNER-ONLY rules: you can only
--      see and change your own rows.

-- --- 1. profiles: one row per auth user ---
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'player' check (role in ('player', 'coach')),
  name       text not null default '',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "own_profile" on profiles;
create policy "own_profile"
  on profiles
  for all
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- --- 2. players: belong to a user ---
-- auth.uid() as the default means new rows are automatically owned by whoever
-- is logged in — the app doesn't have to set it.
alter table players
  add column if not exists "ownerId" uuid references auth.users(id) on delete cascade default auth.uid();

drop policy if exists "demo_players_all_access" on players;
drop policy if exists "own_players" on players;
create policy "own_players"
  on players
  for all
  to authenticated
  using ("ownerId" = auth.uid())
  with check ("ownerId" = auth.uid());

-- --- 3. sessions: belong to a user ---
alter table sessions
  add column if not exists "ownerId" uuid references auth.users(id) on delete cascade default auth.uid();

drop policy if exists "demo_sessions_all_access" on sessions;
drop policy if exists "own_sessions" on sessions;
create policy "own_sessions"
  on sessions
  for all
  to authenticated
  using ("ownerId" = auth.uid())
  with check ("ownerId" = auth.uid());
