-- AthletIQ database schema
-- ---------------------------------------------------------------------------
-- Run this in your Supabase project: Dashboard -> SQL Editor -> New query ->
-- paste -> Run. Re-running is safe (uses IF NOT EXISTS / drops the policy first).
--
-- Note on column names: we use quoted "camelCase" columns so they match the
-- TypeScript types in src/types.ts EXACTLY (e.g. player.currentFocus). That
-- means no field-name mapping in the app code — simpler for now. Postgres
-- normally prefers snake_case, but matching the contract keeps this readable
-- for a first project.

-- Table: players  (mirrors the Player interface in src/types.ts)
create table if not exists players (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  age           int  not null,
  -- Only the four supported positions are allowed (mirrors the Position type).
  position      text not null check (position in ('striker','midfielder','defender','goalkeeper')),
  "currentFocus" text not null default '',
  goal          text not null default '',
  language      text not null default 'en',
  -- Bookkeeping: when the row was created (handy for "newest first" sorting).
  created_at    timestamptz not null default now()
);

-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
-- RLS is ON. Because we have no real auth yet (just a player/coach toggle for
-- the demo), we add ONE permissive policy that lets the anon key read/write.
-- This is fine for a hackathon demo. TODO: tighten this once we add real auth.
alter table players enable row level security;

drop policy if exists "demo_players_all_access" on players;
create policy "demo_players_all_access"
  on players
  for all              -- select, insert, update, delete
  to anon, authenticated
  using (true)         -- who can read existing rows
  with check (true);   -- what new/updated rows are allowed
