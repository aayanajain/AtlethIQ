# Troubleshooting Guide

## Error: "null value in column 'name' of relation 'players' violates not-null constraint"

### **Problem:**
When trying to complete the getting-started wizard, you get this error:
```
null value in column "name" of relation "players" violates not-null constraint
```

### **Why This Happens:**
The old database schema has `name`, `age`, and `goal` columns marked as **required (NOT NULL)**, but the new onboarding code uses different field names:
- Old: `name` → New: `fullName`
- Old: `age` → New: `dateOfBirth`
- Old: `goal` → New: `goals` (array)

When the wizard tries to INSERT a new player with only the new fields, the database rejects it because the old required fields are missing.

### **Solution:**

#### **Option 1: Quick Hotfix (Recommended)**
Run the hotfix SQL immediately:

1. Open Supabase Dashboard
2. Go to: **SQL Editor** → **New query**
3. Copy contents of: `supabase/HOTFIX_make_legacy_nullable.sql`
4. Paste and click **Run**

This makes the legacy columns nullable so new INSERTs succeed.

#### **Option 2: Run Full Migration (If You Haven't)**
If you haven't run the migration yet:

1. Open Supabase Dashboard
2. Go to: **SQL Editor** → **New query**
3. Copy contents of: `supabase/players_v2_migration.sql`
4. Paste and click **Run**

The updated migration now includes the hotfix (Step 12).

---

## Error: "Getting-started page redirects to dashboard immediately"

### **Problem:**
After login, you land on getting-started but immediately get redirected to dashboard.

### **Why This Happens:**
1. DEV_MODE is set to `false`, OR
2. Your player profile has `onboardingCompleted = true`

### **Solution:**

#### If Testing the Onboarding Flow:
Set **DEV_MODE = true** in both files:
- `app/login/page.tsx` (line ~10)
- `app/(protected)/player/getting-started/page.tsx` (line ~23)

#### If You Want Normal Behavior:
Reset your player's onboarding status in Supabase:

```sql
UPDATE players 
SET "onboardingCompleted" = false 
WHERE id = 'YOUR_USER_ID';
```

Or delete your player profile and start fresh:
```sql
DELETE FROM players WHERE id = 'YOUR_USER_ID';
```

---

## Error: "Cannot read properties of null (reading 'split')"

### **Problem:**
Dashboard crashes with:
```
Cannot read properties of null (reading 'split')
at initials (app/(protected)/player/page.tsx:410:6)
```

### **Why This Happens:**
The dashboard is trying to use the old `player.name` field, but new players only have `player.fullName`. When `name` is undefined, calling `.split()` on it crashes.

### **Solution:**
**Already Fixed!** The dashboard has been updated to use `fullName` instead of `name`.

If you're still seeing this error:
1. Make sure you pulled the latest code
2. Restart your dev server (Ctrl+C, then `npm run dev`)
3. Hard refresh your browser (Ctrl+Shift+R)

If problem persists, check if other pages are using old field names.

---

## Error: "Cannot read properties of null (reading 'fullName')"

### **Problem:**
Profile page crashes when trying to load data.

### **Why This Happens:**
The profile page expects a player profile to exist, but yours doesn't.

### **Solution:**
Complete the getting-started wizard first:
1. Navigate to `/player/getting-started`
2. Complete all 6 steps
3. Click "Create My Profile"
4. Then try accessing `/player/profile`

---

## Error: Age validation fails (says age is 0 or invalid)

### **Problem:**
Date of birth is entered but age shows as 0 or validation fails.

### **Why This Happens:**
Date format mismatch or timezone issues.

### **Solution:**
1. Use the date picker (don't type manually)
2. Ensure date is in YYYY-MM-DD format
3. Check that the date is between 10-18 years ago
4. Try refreshing the page

---

## Error: "Failed to create profile" on final submit

### **Possible Causes:**

### 1. **Database Constraint Violations**
**Check:**
```sql
-- Verify all constraints
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'players'::regclass;
```

**Fix:** Ensure legacy columns are nullable (see hotfix above)

### 2. **RLS Policy Issues**
**Check:**
```sql
-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'players';
```

**Fix:** Ensure policies allow INSERT for authenticated users

### 3. **Missing Required Fields**
**Check browser console** for the exact error message.

**Common issues:**
- Gender not selected
- Position not selected
- Fitness level not selected
- No goals selected
- No training days selected
- Preferred time not selected

---

## Error: Sessions or other tables referencing players fail

### **Problem:**
Other tables have foreign keys to `players` table and fail after migration.

### **Solution:**
Update foreign key constraints if needed:

```sql
-- Check foreign keys
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'players';
```

Usually no action needed - foreign keys reference `id`, which hasn't changed.

---

## Dev Mode Not Working

### **Problem:**
DEV_MODE is set to true but still can't access getting-started page.

### **Checklist:**
- [ ] Saved both files after changing DEV_MODE
- [ ] Restarted dev server (Ctrl+C, then `npm run dev`)
- [ ] Cleared browser cache (Ctrl+Shift+R)
- [ ] Check browser console for errors
- [ ] Verify you're logged in
- [ ] Try incognito/private window

---

## Database Schema Verification

### Check Current Schema:
```sql
-- See all columns in players table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'players'
ORDER BY ordinal_position;
```

### Expected Columns:
**New Required Fields:**
- fullName (text, NOT NULL)
- dateOfBirth (text, NOT NULL)
- gender (text, NOT NULL)
- position (text, NOT NULL)
- dominantFoot (text, NOT NULL)
- yearsPlaying (int, NOT NULL)
- fitnessLevel (text, NOT NULL)
- goals (text[], NOT NULL)
- trainingDays (text[], NOT NULL)
- preferredTime (text, NOT NULL)
- sessionDuration (int, NOT NULL)
- onboardingCompleted (boolean, NOT NULL, default false)

**New Optional Fields:**
- currentClub (text, nullable)
- height (int, nullable)
- weight (int, nullable)

**Legacy Fields (should be nullable):**
- name (text, nullable) ← Must be nullable!
- age (int, nullable) ← Must be nullable!
- goal (text, nullable) ← Must be nullable!

---

## Still Having Issues?

### Debug Steps:
1. **Check browser console** (F12) for JavaScript errors
2. **Check Supabase logs** (Dashboard → Logs)
3. **Verify database schema** (see queries above)
4. **Test with fresh user account**
5. **Check RLS policies are active**

### Get More Info:
Run this diagnostic query:
```sql
SELECT 
  id,
  "fullName",
  "onboardingCompleted",
  name,
  "createdAt"
FROM players
LIMIT 5;
```

This shows which fields are populated and onboarding status.

---

## Clean Slate (Nuclear Option)

If nothing works, start fresh:

```sql
-- ⚠️ WARNING: This deletes ALL player data!

-- 1. Drop the players table
DROP TABLE IF EXISTS players CASCADE;

-- 2. Run the complete schema
-- Paste contents of schema_v2.sql

-- 3. Create a new account or delete user and re-signup
```

---

## Contact

If you're still stuck:
1. Check the error message in browser console
2. Check Supabase logs
3. Verify which migration you ran
4. Check that DEV_MODE settings are correct
5. Review this troubleshooting guide thoroughly
