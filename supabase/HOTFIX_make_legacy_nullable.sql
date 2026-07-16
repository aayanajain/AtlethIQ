-- HOTFIX: Make Legacy Columns Nullable
-- ---------------------------------------------------------------------------
-- Run this immediately to fix the "name violates not-null constraint" error.
--
-- PROBLEM: The old schema has name/age/goal as NOT NULL, but the new code
-- uses fullName/dateOfBirth/goals instead. When inserting new players, the
-- old columns are empty, causing constraint violations.
--
-- SOLUTION: Make the legacy columns nullable so new INSERTs succeed.
--
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> Run

-- Make legacy columns nullable
ALTER TABLE players 
  ALTER COLUMN name DROP NOT NULL;

ALTER TABLE players 
  ALTER COLUMN age DROP NOT NULL;

ALTER TABLE players 
  ALTER COLUMN goal DROP NOT NULL;

-- Optional: Clean up any existing NULL values
UPDATE players SET name = '' WHERE name IS NULL;
UPDATE players SET goal = '' WHERE goal IS NULL;

-- Verify the changes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'players' 
  AND column_name IN ('name', 'age', 'goal', 'fullName', 'dateOfBirth', 'goals')
ORDER BY column_name;

-- You should see:
-- name        | YES | text
-- age         | YES | integer  
-- goal        | YES | text
-- fullName    | NO  | text
-- dateOfBirth | NO  | text
-- goals       | NO  | ARRAY

-- ---------------------------------------------------------------------------
-- Done! You can now complete the onboarding wizard without errors.
-- ---------------------------------------------------------------------------
