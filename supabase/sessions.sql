-- AthletIQ — sessions table
-- ---------------------------------------------------------------------------
-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (uses IF NOT EXISTS / drops the policy first).
--
-- Mirrors the Session interface in src/types.ts. The five skill ratings live in
-- a single JSONB "metrics" column so the shape matches Session.metrics exactly
-- (an object: { passing, finishing, dribbling, stamina, weakFoot }) with no
-- field-name mapping in the app code.

create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  -- Which player this session belongs to. Deleting a player deletes their
  -- sessions too (on delete cascade).
  "playerId"    uuid not null references players(id) on delete cascade,
  -- The training date. Postgres `date` returns as a "YYYY-MM-DD" string.
  date          date not null default current_date,
  -- The raw plain-language note the player typed.
  note          text not null,
  -- The five skill ratings (1–10 each) as one JSON object, e.g.
  -- {"passing":7,"finishing":5,"dribbling":6,"stamina":8,"weakFoot":4}
  metrics       jsonb not null,
  -- How tired / how good the player felt (1–10 each).
  fatigue       int not null check (fatigue between 1 and 10),
  mood          int not null check (mood between 1 and 10),
  -- Optional fueling fields (used later by the meal-photo feature).
  "mealPhotoRef"   text,
  "fuelingFeedback" text,
  created_at    timestamptz not null default now()
);

-- Helpful index: we very often fetch "all sessions for one player, by date".
create index if not exists sessions_player_date_idx
  on sessions ("playerId", date);

-- Row Level Security — each player may only touch their own sessions.
-- A session's "playerId" equals the owner's players.id, which equals auth.uid().
alter table sessions enable row level security;

drop policy if exists "demo_sessions_all_access" on sessions;

create policy "sessions_select_own"
  on sessions
  for select
  to authenticated
  using ("playerId" = auth.uid());

create policy "sessions_insert_own"
  on sessions
  for insert
  to authenticated
  with check ("playerId" = auth.uid());

create policy "sessions_update_own"
  on sessions
  for update
  to authenticated
  using ("playerId" = auth.uid())
  with check ("playerId" = auth.uid());

create policy "sessions_delete_own"
  on sessions
  for delete
  to authenticated
  using ("playerId" = auth.uid());
