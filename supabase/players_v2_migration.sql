-- AthletIQ Player Profile Migration (v2)
-- ---------------------------------------------------------------------------
-- This migration adds comprehensive onboarding fields to the players table.
-- Run this in your Supabase project: Dashboard -> SQL Editor -> New query ->
-- paste -> Run.
--
-- IMPORTANT: This migration is ADDITIVE and safe to run multiple times.
-- It adds new columns and sets onboardingCompleted = false for all existing
-- players, requiring them to complete the new onboarding flow.
--
-- Column naming: We continue using camelCase (quoted) to match TypeScript
-- exactly, avoiding field-name mapping in the app code.

-- ---------------------------------------------------------------------------
-- Step 1: Add new Personal Information columns
-- ---------------------------------------------------------------------------

-- Full name (replaces 'name')
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "fullName" text;

-- Date of birth (replaces calculated 'age')
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "dateOfBirth" text;

-- Gender
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS gender text 
  CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say'));

-- ---------------------------------------------------------------------------
-- Step 2: Add new Football Details columns
-- ---------------------------------------------------------------------------

-- Dominant foot
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "dominantFoot" text 
  CHECK ("dominantFoot" IN ('left', 'right', 'both'));

-- Years of playing
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "yearsPlaying" int;

-- Current club (optional)
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "currentClub" text;

-- ---------------------------------------------------------------------------
-- Step 3: Add new Physical Details columns
-- ---------------------------------------------------------------------------

-- Height in centimeters (optional)
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS height int;

-- Weight in kilograms (optional)
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS weight int;

-- Fitness level
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "fitnessLevel" text 
  CHECK ("fitnessLevel" IN ('beginner', 'intermediate', 'advanced'));

-- ---------------------------------------------------------------------------
-- Step 4: Add Goals column (array)
-- ---------------------------------------------------------------------------

-- Goals array (replaces single 'goal' string)
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS goals text[] DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- Step 5: Add Availability columns
-- ---------------------------------------------------------------------------

-- Training days (array of weekdays)
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "trainingDays" text[] DEFAULT '{}';

-- Preferred training time
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "preferredTime" text 
  CHECK ("preferredTime" IN ('morning', 'afternoon', 'evening'));

-- Session duration in minutes
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "sessionDuration" int;

-- ---------------------------------------------------------------------------
-- Step 6: Add Meta/Onboarding tracking columns
-- ---------------------------------------------------------------------------

-- Track if onboarding is complete
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "onboardingCompleted" boolean DEFAULT false;

-- Updated timestamp
ALTER TABLE players 
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now();

-- ---------------------------------------------------------------------------
-- Step 7: Update position column to support all 8 positions
-- ---------------------------------------------------------------------------

-- Drop old position constraint
ALTER TABLE players 
  DROP CONSTRAINT IF EXISTS players_position_check;

-- Add new constraint with all 8 positions
ALTER TABLE players 
  ADD CONSTRAINT players_position_check 
  CHECK (position IN (
    'goalkeeper',
    'centre-back',
    'full-back',
    'defensive-mid',
    'central-mid',
    'attacking-mid',
    'winger',
    'striker'
  ));

-- ---------------------------------------------------------------------------
-- Step 8: Set all existing players to onboardingCompleted = false
-- ---------------------------------------------------------------------------
-- This forces all existing users through the new onboarding flow

UPDATE players 
SET "onboardingCompleted" = false 
WHERE "onboardingCompleted" IS NULL OR "onboardingCompleted" = true;

-- ---------------------------------------------------------------------------
-- Step 9: Create indexes for better query performance
-- ---------------------------------------------------------------------------

-- Index for onboarding check queries (most common lookup)
CREATE INDEX IF NOT EXISTS idx_players_onboarding 
  ON players(id, "onboardingCompleted");

-- Index for position-based queries
CREATE INDEX IF NOT EXISTS idx_players_position 
  ON players(position);

-- Index for date queries (created_at already has index, add updatedAt)
CREATE INDEX IF NOT EXISTS idx_players_updated 
  ON players("updatedAt");

-- ---------------------------------------------------------------------------
-- Step 10: Add helpful comments to columns
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN players."fullName" IS 'Player full name';
COMMENT ON COLUMN players."dateOfBirth" IS 'Date of birth in YYYY-MM-DD format';
COMMENT ON COLUMN players.gender IS 'Gender identity';
COMMENT ON COLUMN players."dominantFoot" IS 'Preferred foot (left/right/both)';
COMMENT ON COLUMN players."yearsPlaying" IS 'Years of football experience';
COMMENT ON COLUMN players."currentClub" IS 'Current club or team name (optional)';
COMMENT ON COLUMN players.height IS 'Height in centimeters (optional)';
COMMENT ON COLUMN players.weight IS 'Weight in kilograms (optional)';
COMMENT ON COLUMN players."fitnessLevel" IS 'Self-assessed fitness level';
COMMENT ON COLUMN players.goals IS 'Array of development goals';
COMMENT ON COLUMN players."trainingDays" IS 'Available training days';
COMMENT ON COLUMN players."preferredTime" IS 'Preferred training time of day';
COMMENT ON COLUMN players."sessionDuration" IS 'Preferred session duration in minutes';
COMMENT ON COLUMN players."onboardingCompleted" IS 'Whether onboarding wizard is complete';
COMMENT ON COLUMN players."updatedAt" IS 'Last profile update timestamp';

-- ---------------------------------------------------------------------------
-- Step 11: Create trigger to auto-update updatedAt
-- ---------------------------------------------------------------------------

-- Function to update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_players_updated_at ON players;

-- Create trigger
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Step 12: Make legacy columns nullable (allow new code to skip them)
-- ---------------------------------------------------------------------------
-- The new code uses fullName/dateOfBirth/goals instead of name/age/goal.
-- Make the old columns nullable so new INSERTs don't fail.

ALTER TABLE players 
  ALTER COLUMN name DROP NOT NULL;

ALTER TABLE players 
  ALTER COLUMN age DROP NOT NULL;

ALTER TABLE players 
  ALTER COLUMN goal DROP NOT NULL;

-- Update existing NULL values to empty strings (optional, for cleaner data)
UPDATE players SET name = '' WHERE name IS NULL;
UPDATE players SET goal = '' WHERE goal IS NULL;

-- ---------------------------------------------------------------------------
-- Migration complete! 
-- ---------------------------------------------------------------------------
-- All existing players now have onboardingCompleted = false and will be
-- prompted to complete the new onboarding flow on their next login.
--
-- Legacy columns (name, age, goal) are now NULLABLE for backward compatibility
-- during the transition period. New players won't have these fields populated.
-- You can drop them later once confirmed that all code uses the new fields.
--
-- To rollback (if needed):
-- 1. ALTER TABLE players DROP COLUMN IF EXISTS "columnName";
-- 2. Repeat for all new columns
-- 3. Restore old position constraint
-- 4. Restore NOT NULL on legacy columns
-- ---------------------------------------------------------------------------
