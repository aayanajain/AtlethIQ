-- AthletIQ — plans HISTORY migration
-- ---------------------------------------------------------------------------
-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run. Run AFTER plans.sql (it upgrades that table in place).
--
-- Why this exists: plans used to be cached ONE-per-player (upsert on
-- "playerId") just so the dashboard could show "Your next focus". The Journey
-- page needs a HISTORY instead: the plans a player explicitly chose to keep,
-- shown on a timeline alongside their logged sessions.
--
-- This migration turns `plans` into an append-only log: many rows per player,
-- each a plan they saved, with the context it was built from and when.

-- 1. Drop the one-row-per-player uniqueness so we can append multiple plans.
--    (Column-level `unique "playerId"` is named plans_playerId_key by Postgres.)
alter table plans drop constraint if exists "plans_playerId_key";

-- 2. When the plan was saved. We keep the older `updated_at` column if present,
--    but the timeline orders by `created_at`.
alter table plans add column if not exists created_at timestamptz not null default now();

-- 3. The context the plan was generated from (opponent/venue/games + the
--    optional "tailor it to…" message), so the Journey can show what it was for.
alter table plans add column if not exists context jsonb not null default '{}'::jsonb;

-- 4. Helpful index for the timeline / latest-plan lookups.
create index if not exists plans_player_created_idx on plans ("playerId", created_at desc);

-- RLS from plans.sql (owner-only) still applies unchanged.
