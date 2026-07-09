-- AthletIQ — logging v2 (roles + session types + drills)
-- ---------------------------------------------------------------------------
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run. Safe to re-run.
--
-- Supports the richer, position-aware logging: specific roles, session types,
-- and ticked drills.

-- 1. Allow the new granular ROLES in players.position.
--    We drop the old 4-value check and let the app's dropdown enforce valid
--    roles (simpler, and avoids constraint-name pitfalls).
alter table players drop constraint if exists players_position_check;

-- 2. New session fields.
--    sessionType: match / team / solo / gym / fitness / recovery
alter table sessions add column if not exists "sessionType" text;
--    drills: the ids of the drills the player ticked
alter table sessions add column if not exists drills jsonb not null default '[]'::jsonb;
--    effort: session RPE (how hard it was), 1-10
alter table sessions add column if not exists effort int;

-- 3. Loosen the old required columns so the new flow can omit them.
--    `fatigue` is replaced by `effort`; `metrics` may be empty for gym/recovery.
alter table sessions alter column fatigue drop not null;
alter table sessions alter column metrics set default '{}'::jsonb;
