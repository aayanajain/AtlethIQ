# Database Migration Guide - Player Profile v2

## Overview
This guide explains how to migrate your AthletIQ database to support the new comprehensive player onboarding system.

---

## For EXISTING Installations (Has Data)

If you already have a `players` table with data, use the **migration file**:

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor** → **New query**
3. Open and copy the contents of: `players_v2_migration.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press F5)

### What This Does:
- ✅ Adds all new columns to existing `players` table
- ✅ Sets `onboardingCompleted = false` for all existing players
- ✅ Creates indexes for better performance
- ✅ Adds auto-update trigger for `updatedAt`
- ✅ **Keeps legacy columns** (`name`, `age`, `goal`) for backward compatibility
- ✅ Safe to run multiple times (idempotent)

### After Running:
- All existing users will be prompted to complete the new onboarding flow on next login
- Old data is preserved in legacy columns
- New fields will be populated as users complete onboarding

---

## For NEW Installations (No Data)

If you're setting up AthletIQ from scratch, use the **complete schema**:

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor** → **New query**
3. Open and copy the contents of: `schema_v2.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press F5)

### What This Does:
- ✅ Creates `players` table with all new fields
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Creates indexes for performance
- ✅ Adds auto-update trigger for `updatedAt`
- ✅ Ready for new user signups

---

## What Changed?

### New Fields Added:

#### Personal Information
- `fullName` (text) - Replaces `name`
- `dateOfBirth` (text) - Replaces calculated `age`
- `gender` (text) - New field

#### Football Details
- `dominantFoot` (text) - left/right/both
- `yearsPlaying` (int) - Years of experience
- `currentClub` (text, optional) - Current team

#### Physical Details
- `height` (int, optional) - Height in cm
- `weight` (int, optional) - Weight in kg
- `fitnessLevel` (text) - beginner/intermediate/advanced

#### Goals
- `goals` (text[]) - Array of goals (replaces single `goal` string)

#### Availability
- `trainingDays` (text[]) - Array of available days
- `preferredTime` (text) - morning/afternoon/evening
- `sessionDuration` (int) - Duration in minutes

#### Meta
- `onboardingCompleted` (boolean) - Tracks onboarding status
- `updatedAt` (timestamptz) - Auto-updated timestamp

### Position Field Updated:
Now supports all 8 specific positions:
- `goalkeeper`
- `centre-back`
- `full-back`
- `defensive-mid`
- `central-mid`
- `attacking-mid`
- `winger`
- `striker`

---

## Verification

After running the migration, verify it worked:

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'players' 
ORDER BY ordinal_position;

-- Check all players have onboardingCompleted = false
SELECT id, "fullName", "onboardingCompleted" 
FROM players;

-- Check indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'players';
```

---

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove new columns
ALTER TABLE players DROP COLUMN IF EXISTS "fullName";
ALTER TABLE players DROP COLUMN IF EXISTS "dateOfBirth";
ALTER TABLE players DROP COLUMN IF EXISTS gender;
ALTER TABLE players DROP COLUMN IF EXISTS "dominantFoot";
ALTER TABLE players DROP COLUMN IF EXISTS "yearsPlaying";
ALTER TABLE players DROP COLUMN IF EXISTS "currentClub";
ALTER TABLE players DROP COLUMN IF EXISTS height;
ALTER TABLE players DROP COLUMN IF EXISTS weight;
ALTER TABLE players DROP COLUMN IF EXISTS "fitnessLevel";
ALTER TABLE players DROP COLUMN IF EXISTS goals;
ALTER TABLE players DROP COLUMN IF EXISTS "trainingDays";
ALTER TABLE players DROP COLUMN IF EXISTS "preferredTime";
ALTER TABLE players DROP COLUMN IF EXISTS "sessionDuration";
ALTER TABLE players DROP COLUMN IF EXISTS "onboardingCompleted";
ALTER TABLE players DROP COLUMN IF EXISTS "updatedAt";

-- Remove trigger
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Restore old position constraint
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_position_check;
ALTER TABLE players ADD CONSTRAINT players_position_check 
  CHECK (position IN ('striker','midfielder','defender','goalkeeper'));
```

---

## Troubleshooting

### Error: "column already exists"
- **Solution:** Safe to ignore. The migration is idempotent and won't recreate existing columns.

### Error: "constraint already exists"
- **Solution:** Safe to ignore. The migration handles this gracefully.

### Users can't access their profiles after migration
- **Check:** Ensure RLS policies are active
- **Run:** `SELECT * FROM players WHERE id = auth.uid()` to verify access
- **Fix:** Review RLS policies in Supabase Dashboard → Authentication → Policies

### Performance issues after migration
- **Check:** Ensure indexes were created successfully
- **Run:** Query to verify indexes (see Verification section above)
- **Fix:** Manually create missing indexes

---

## Next Steps

After migration:
1. ✅ Update frontend code to use new field names
2. ✅ Deploy new onboarding flow (`/player/getting-started`)
3. ✅ Test complete onboarding workflow
4. ✅ Monitor for any issues
5. ✅ After confirming everything works, optionally drop legacy columns (`name`, `age`, `goal`)

---

## Questions?

If you encounter any issues:
1. Check the Supabase logs: Dashboard → Logs
2. Verify your RLS policies
3. Ensure your Supabase project is on the latest version
4. Review the SQL comments in the migration file for detailed explanations
