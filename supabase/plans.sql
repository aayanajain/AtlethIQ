-- AthletIQ — plans table (persist the latest AI plan)
-- ---------------------------------------------------------------------------
-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run.
--
-- Why this exists: CLAUDE.md says plans are "derived, not stored". We keep that
-- spirit — we don't build a history of plans — but we DO cache the ONE latest
-- plan per player so the dashboard can show "Your next focus" without
-- regenerating on every visit. One row per player (upsert on "playerId").
--
-- The whole Plan JSON (see the Plan type in src/types.ts) lives in a single
-- jsonb column, so there's no field-by-field mapping in the app.

create table if not exists plans (
  id           uuid primary key default gen_random_uuid(),
  -- One plan row per player. `unique` lets us upsert (insert-or-replace).
  "playerId"   uuid not null unique references players(id) on delete cascade,
  -- Which auth user owns this row. Defaults to whoever is logged in, so the
  -- app never has to set it (same pattern as players/sessions in auth.sql).
  "ownerId"    uuid references auth.users(id) on delete cascade default auth.uid(),
  -- What the plan was for (next-session / week / match / tournament).
  horizon      text not null,
  -- The full Plan JSON returned by /api/generate-plan.
  plan         jsonb not null,
  updated_at   timestamptz not null default now()
);

-- Owner-only security — same rule as players and sessions.
alter table plans enable row level security;

drop policy if exists "own_plans" on plans;
create policy "own_plans"
  on plans
  for all
  to authenticated
  using ("ownerId" = auth.uid())
  with check ("ownerId" = auth.uid());
