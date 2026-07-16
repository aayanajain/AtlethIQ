# Production Deployment Checklist

## Pre-Deployment Checklist

### 1. **Environment Configuration** ⚠️ CRITICAL

#### DEV_MODE Settings (Must be FALSE)
- [ ] `app/login/page.tsx` - Set `DEV_MODE = false` (line ~10)
- [ ] `app/(protected)/player/getting-started/page.tsx` - Set `DEV_MODE = false` (line ~23)
- [ ] `app/(protected)/player/layout.tsx` - Set `DEV_MODE = false` (line ~15)

#### Environment Variables
- [ ] Verify `.env.local` has all required variables
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
  - LLM API keys (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- [ ] Create `.env.production` with production values
- [ ] Never commit `.env` files to Git

---

### 2. **Database Migration**

- [ ] Run `HOTFIX_make_legacy_nullable.sql` in Supabase SQL Editor
- [ ] Or run complete `players_v2_migration.sql` if fresh migration
- [ ] Verify all new columns exist:
  ```sql
  SELECT column_name, data_type, is_nullable 
  FROM information_schema.columns 
  WHERE table_name = 'players';
  ```
- [ ] Check constraints are correct (position, gender, etc.)
- [ ] Verify indexes are created
- [ ] Test RLS policies work correctly

---

### 3. **Code Quality & Testing**

#### TypeScript
- [ ] Run `npm run build` - should complete without errors
- [ ] Fix any TypeScript errors
- [ ] Check for `any` types that should be specific

#### Linting
- [ ] Run `npm run lint` - should pass
- [ ] Fix any ESLint warnings

#### Manual Testing
- [ ] Test complete onboarding flow (new user)
- [ ] Test profile editing (existing user)
- [ ] Test all navigation links work
- [ ] Test session logging
- [ ] Test dashboard loads correctly
- [ ] Test coach pages if applicable
- [ ] Test on mobile (responsive design)
- [ ] Test on different browsers (Chrome, Firefox, Safari)

---

### 4. **Security**

#### Authentication
- [ ] RLS policies are active on all tables
- [ ] Users can only access their own data
- [ ] No endpoints expose sensitive data
- [ ] API routes validate authentication

#### API Keys
- [ ] All API keys are in environment variables
- [ ] No keys committed to Git
- [ ] Keys are different for dev/prod
- [ ] Service role key never used client-side

#### Input Validation
- [ ] All form inputs are validated
- [ ] SQL injection prevention (using Supabase parameterized queries)
- [ ] XSS prevention (React handles by default, but verify)

---

### 5. **Performance**

- [ ] Images are optimized (use Next.js Image component)
- [ ] Lazy loading for heavy components
- [ ] Database queries are optimized (indexes in place)
- [ ] No unnecessary re-renders
- [ ] Check bundle size: `npm run build` and review output

---

### 6. **User Experience**

#### Loading States
- [ ] Dashboard shows loading indicator
- [ ] Getting-started wizard shows loading
- [ ] Profile page shows loading
- [ ] Session logging shows progress

#### Error Handling
- [ ] Error boundaries in place
- [ ] Friendly error messages (no raw errors to users)
- [ ] Form validation errors are clear
- [ ] Network error handling

#### Accessibility
- [ ] Form inputs have labels
- [ ] Buttons have aria-labels where needed
- [ ] Color contrast meets WCAG standards
- [ ] Keyboard navigation works

---

### 7. **Content & Copy**

- [ ] All text is user-friendly
- [ ] No development placeholders ("lorem ipsum", "test", etc.)
- [ ] Error messages are helpful
- [ ] Age-appropriate language (users are 10-18)
- [ ] No offensive or inappropriate content

---

### 8. **Data & Privacy**

#### Safety (Users are Minors)
- [ ] No weight/calorie/macro outputs (only qualitative fueling feedback)
- [ ] Encouraging language only (never discouraging)
- [ ] Age validation works (10-18 years)
- [ ] Data collection is minimal
- [ ] Privacy policy in place (if collecting data)

#### Data Management
- [ ] Old test accounts removed
- [ ] No dummy/test data in production DB
- [ ] Backup strategy in place

---

### 9. **Deployment Configuration**

#### Vercel (or your platform)
- [ ] Environment variables set in dashboard
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Node version specified (package.json engines)
- [ ] Domain configured correctly

#### Supabase
- [ ] Production project created (separate from dev)
- [ ] Database backed up
- [ ] RLS policies reviewed
- [ ] API keys rotated (don't use dev keys)

---

### 10. **Post-Deployment Verification**

#### Smoke Tests
- [ ] Landing page loads
- [ ] Login/signup works
- [ ] New user onboarding completes
- [ ] Dashboard displays correctly
- [ ] Session logging works
- [ ] Profile editing works
- [ ] Logout works

#### Monitoring
- [ ] Check Vercel logs for errors
- [ ] Check Supabase logs for DB errors
- [ ] Monitor API rate limits
- [ ] Set up error tracking (Sentry, LogRocket, etc.)

---

## Common Issues & Fixes

### Issue: "DEV_MODE is not defined"
**Fix:** Search all files and set `DEV_MODE = false`

### Issue: "null value violates not-null constraint"
**Fix:** Run `HOTFIX_make_legacy_nullable.sql`

### Issue: "Cannot read properties of null"
**Fix:** Check all Player field references use new names (`fullName`, `dateOfBirth`, `goals`)

### Issue: Users stuck in onboarding loop
**Fix:** Verify `onboardingCompleted` is set to `true` on completion

### Issue: RLS policy denies access
**Fix:** Review policies, ensure `auth.uid()` matches user ID

---

## Rollback Plan

If something goes wrong:

1. **Code Issues:**
   - Revert to previous Git commit
   - Redeploy previous version

2. **Database Issues:**
   - Restore from backup
   - Roll back migration (see `players_v2_migration.sql` comments)

3. **Quick Fixes:**
   - Hot-fix via Vercel dashboard
   - Update environment variables
   - Restart services

---

## Performance Benchmarks

Target metrics:
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Lighthouse score > 90
- [ ] No console errors in production

---

## Launch Sequence

1. ✅ Complete all checklist items above
2. ✅ Run final build locally: `npm run build && npm start`
3. ✅ Test production build locally
4. ✅ Set DEV_MODE = false in all files
5. ✅ Commit and push to main branch
6. ✅ Deploy to Vercel (automatic or manual)
7. ✅ Run smoke tests on production URL
8. ✅ Monitor logs for first 24 hours
9. ✅ Announce launch (if applicable)

---

## Post-Launch Monitoring

### Week 1:
- [ ] Check error logs daily
- [ ] Monitor user signups
- [ ] Watch for performance issues
- [ ] Collect user feedback

### Week 2-4:
- [ ] Review analytics
- [ ] Identify pain points
- [ ] Plan improvements
- [ ] Address critical bugs

---

## Support & Maintenance

### Regular Tasks:
- Check logs weekly
- Update dependencies monthly
- Review security advisories
- Back up database regularly
- Monitor API usage/costs

### Emergency Contacts:
- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.io
- Your team: [Add team contact info]

---

## Final Notes

- This is a **youth sports app** - safety and encouragement are paramount
- All content must be age-appropriate (ages 10-18)
- Never output calories, macros, or restrictive eating advice
- Monitor closely in first weeks
- Be ready to hotfix issues quickly

**Good luck with your launch!** 🚀
