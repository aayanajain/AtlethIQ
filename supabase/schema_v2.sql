-- AthletIQ database schema (v2 - Complete)
-- ---------------------------------------------------------------------------
-- Run this in your Supabase project: Dashboard -> SQL Editor -> New query ->
-- paste -> Run. This is the COMPLETE schema for new installations.
--
-- For EXISTING installations, use players_v2_migration.sql instead.
--
-- Note on column names: we use quoted "camelCase" columns so they match the
-- TypeScript types in src/types.ts EXACTLY (e.g. player.currentFocus). That
-- means no field-name mapping in the app code — simpler for now. Postgres
-- normally prefers snake_case, but matching the contract keeps this readable
-- for a first project.

-- ---------------------------------------------------------------------------
-- Table: players (mirrors the Player interface in src/types.ts)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS players (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ── Personal Information ──
  "fullName" text NOT NULL,
  "dateOfBirth" text NOT NULL,
  gender text NOT NULL 
    CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
  
  -- ── Football Details ──
  position text NOT NULL 
    CHECK (position IN (
      'goalkeeper',
      'centre-back',
      'full-back',
      'defensive-mid',
      'central-mid',
      'attacking-mid',
      'winger',
      'striker'
    )),
  "dominantFoot" text NOT NULL 
    CHECK ("dominantFoot" IN ('left', 'right', 'both')),
  "yearsPlaying" int NOT NULL,
  "currentClub" text,  -- Optional
  
  -- ── Physical Details ──
  height int,  -- cm, optional
  weight int,  -- kg, optional
  "fitnessLevel" text NOT NULL 
    CHECK ("fitnessLevel" IN ('beginner', 'intermediate', 'advanced')),
  
  -- ── Goals ──
  goals text[] NOT NULL DEFAULT '{}',
  
  -- ── Availability ──
  "trainingDays" text[] NOT NULL DEFAULT '{}',
  "preferredTime" text NOT NULL 
    CHECK ("preferredTime" IN ('morning', 'afternoon', 'evening')),
  "sessionDuration" int NOT NULL,  -- minutes
  
  -- ── Meta & Legacy Fields ──
  "currentFocus" text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'en',
  "onboardingCompleted" boolean NOT NULL DEFAULT false,
  
  -- ── Timestamps ──
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  
  -- ── Legacy columns (for backward compatibility) ──
  -- Keep these during transition, can be dropped later
  name text,
  age int,
  goal text
);

-- ---------------------------------------------------------------------------
-- Indexes for performance
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_players_onboarding 
  ON players(id, "onboardingCompleted");

CREATE INDEX IF NOT EXISTS idx_players_position 
  ON players(position);

CREATE INDEX IF NOT EXISTS idx_players_updated 
  ON players("updatedAt");

CREATE INDEX IF NOT EXISTS idx_players_created 
  ON players("createdAt");

-- ---------------------------------------------------------------------------
-- Trigger to auto-update updatedAt
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_players_updated_at ON players;

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
-- RLS is ON. This policy allows authenticated users to manage their own profile.
-- Each user can only see/edit their own player row (where id matches their auth.uid()).

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "demo_players_all_access" ON players;
DROP POLICY IF EXISTS "players_own_profile" ON players;

-- Policy: Users can read their own profile
CREATE POLICY "players_select_own"
  ON players
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Users can insert their own profile
CREATE POLICY "players_insert_own"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "players_update_own"
  ON players
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Users can delete their own profile
CREATE POLICY "players_delete_own"
  ON players
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Column comments (documentation)
-- ---------------------------------------------------------------------------

COMMENT ON TABLE players IS 'Player profiles with comprehensive onboarding data';
COMMENT ON COLUMN players.id IS 'UUID primary key, matches Supabase auth.uid()';
COMMENT ON COLUMN players."fullName" IS 'Player full name';
COMMENT ON COLUMN players."dateOfBirth" IS 'Date of birth in YYYY-MM-DD format';
COMMENT ON COLUMN players.gender IS 'Gender identity';
COMMENT ON COLUMN players.position IS 'Playing position (8 specific roles)';
COMMENT ON COLUMN players."dominantFoot" IS 'Preferred foot (left/right/both)';
COMMENT ON COLUMN players."yearsPlaying" IS 'Years of football experience';
COMMENT ON COLUMN players."currentClub" IS 'Current club or team name (optional)';
COMMENT ON COLUMN players.height IS 'Height in centimeters (optional)';
COMMENT ON COLUMN players.weight IS 'Weight in kilograms (optional)';
COMMENT ON COLUMN players."fitnessLevel" IS 'Self-assessed fitness level';
COMMENT ON COLUMN players.goals IS 'Array of development goals (predefined or custom)';
COMMENT ON COLUMN players."trainingDays" IS 'Available training days (array of weekdays)';
COMMENT ON COLUMN players."preferredTime" IS 'Preferred training time of day';
COMMENT ON COLUMN players."sessionDuration" IS 'Preferred session duration in minutes';
COMMENT ON COLUMN players."currentFocus" IS 'What the player is currently working on';
COMMENT ON COLUMN players.language IS 'Preferred language code (e.g., "en")';
COMMENT ON COLUMN players."onboardingCompleted" IS 'Whether onboarding wizard is complete';
COMMENT ON COLUMN players."createdAt" IS 'Profile creation timestamp';
COMMENT ON COLUMN players."updatedAt" IS 'Last profile update timestamp (auto-updated)';

-- ---------------------------------------------------------------------------
-- Schema ready!
-- ---------------------------------------------------------------------------
-- Players table is ready with all fields for comprehensive onboarding.
-- All new users will have onboardingCompleted = false by default.
-- ---------------------------------------------------------------------------
