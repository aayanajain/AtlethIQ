# Dev Mode Configuration Guide

## Overview
Dev mode forces the getting-started page to always show after login, bypassing the `onboardingCompleted` check. This is useful for testing the onboarding flow repeatedly without having to delete database records.

---

## How to Enable/Disable Dev Mode

### Files with DEV_MODE Toggle:

#### 1. **Login Page** (`app/login/page.tsx`)
```typescript
// Line ~10
const DEV_MODE = true; // Set to false in production
```

**What it does:**
- When `true`: Player login redirects to `/player/getting-started`
- When `false`: Player login redirects to `/player` (normal behavior)

#### 2. **Getting Started Page** (`app/(protected)/player/getting-started/page.tsx`)
```typescript
// Line ~23
const DEV_MODE = true; // Set to false in production
```

**What it does:**
- When `true`: Skips the `onboardingCompleted` check, always allows access
- When `false`: Checks `onboardingCompleted`, redirects to dashboard if already completed

---

## Dev Mode Behavior

### With DEV_MODE = true:

1. **Login Flow:**
   ```
   User logs in → Always redirects to /player/getting-started
   ```

2. **Getting Started Page:**
   ```
   User accesses page → Skips onboarding check → Shows wizard
   ```

3. **Testing Benefits:**
   - Can test the onboarding flow multiple times
   - No need to delete database records
   - No need to create new accounts
   - Can iterate on UI/UX quickly

### With DEV_MODE = false (Production):

1. **Login Flow:**
   ```
   User logs in → Redirects to /player (dashboard)
   ```

2. **Getting Started Page:**
   ```
   New user (onboardingCompleted = false) → Shows wizard
   Existing user (onboardingCompleted = true) → Redirects to dashboard
   ```

3. **Normal Behavior:**
   - Onboarding only shows once per user
   - After completion, user can't access getting-started
   - Uses `/player/profile` for editing

---

## Quick Testing Workflow

### For Testing Onboarding:

1. **Set DEV_MODE = true** in both files
2. Log in with any account
3. You'll always land on getting-started page
4. Complete or partially complete the wizard
5. Log out and log back in
6. You'll see getting-started again (not dashboard)

### For Testing Dashboard:

1. **Set DEV_MODE = false** in both files
2. Ensure your account has `onboardingCompleted = true`
3. Log in
4. You'll land on dashboard
5. Can access getting-started by manually navigating (will be redirected back)

---

## Before Production Deploy

### ⚠️ CRITICAL: Set DEV_MODE = false in BOTH files

**Checklist:**
- [ ] `app/login/page.tsx` → DEV_MODE = false
- [ ] `app/(protected)/player/getting-started/page.tsx` → DEV_MODE = false
- [ ] Test login flow works normally
- [ ] Test new users see onboarding
- [ ] Test existing users go to dashboard

---

## Alternative: Environment Variable (Better for Production)

### Option 1: Use process.env (Recommended)

Create `.env.local`:
```bash
NEXT_PUBLIC_DEV_MODE=true
```

Update code:
```typescript
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
```

**Benefits:**
- Single source of truth
- Can't accidentally deploy with wrong value
- Different values for local vs production

### Option 2: Use NODE_ENV
```typescript
const DEV_MODE = process.env.NODE_ENV === 'development';
```

**Benefits:**
- Automatic based on environment
- No manual toggle needed
- Safe for production

---

## Current Status

✅ **DEV_MODE = true** (Testing onboarding flow)

When you're ready for production:
1. Search for `const DEV_MODE = true`
2. Change to `const DEV_MODE = false`
3. Test the full flow
4. Deploy

---

## Troubleshooting

### "I'm stuck in an infinite loop"
- Check both DEV_MODE flags are set consistently
- Clear browser cache
- Check database `onboardingCompleted` value

### "Getting-started doesn't show even with DEV_MODE = true"
- Ensure you saved both files
- Restart your dev server
- Check browser console for errors

### "After onboarding, I'm redirected back to getting-started"
- Check if `onboardingCompleted` is being set to `true` on submit
- Verify the database update query is successful
- Check browser console for API errors

---

## Notes

- Dev mode only affects client-side routing logic
- Database still updates normally when you complete onboarding
- You can manually set `onboardingCompleted = false` in Supabase to reset a user
- Consider using environment variables for production-ready code
