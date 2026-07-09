# AthletIQ — Project Context

## What this is
An AI-powered web app for youth football development (project name: AthletIQ). Young players log simple
session data in plain language; an LLM turns it into a personalized,
position-aware development plan that adapts week over week. A two-sided
player↔coach loop lets coaches set focus areas, and the AI flags mismatches
(e.g. fatigue, plateau). Built over ~10 days by a 2-person team for a hackathon,
but scoped as a real PRODUCT (full site with public pages + authenticated app),
not just a demo.

The goal is an affordable "AI sports scientist + mentor" for young athletes in
under-resourced areas who lack access to elite academy tools, plus a tool that
helps overstretched coaches track each player individually.

## Who it's for
- Primary user: young footballers aged 10–18.
- Secondary user: their coach (large squads, no per-player tracking tools).
- Note: users are MINORS. Safety rules below are non-negotiable.

## Tech stack (do not change without asking)
- Next.js (App Router) + TypeScript + Tailwind CSS
- Next.js API routes for the server layer (NO separate Express server)
- Supabase for database (Postgres) + Storage (meal photos) + Auth (real login)
- A multimodal LLM API for reasoning + vision, called ONLY from the server side
- Recharts for the development-curve charts
- Deploy target: Vercel

## Hard architecture rules
1. The client NEVER calls the LLM directly. All LLM calls go through Next.js
   API routes so the LLM API key stays server-side only (in env vars).
2. The Supabase anon key is browser-safe and can be used client-side with Row
   Level Security. The LLM key is NOT — server only.
3. LLM outputs that drive the UI must be JSON. Always use the model's structured
   / JSON output mode, strip any markdown fences, and wrap JSON.parse in
   try/catch on the server before sending to the client.

## Site structure (this is a full product, not one page)
PRE-AUTH (public, no login):
- Landing / home page: explains AthletIQ, its value, who it's for. Clear CTA to
  sign up.
- How-it-works / features section (can be part of landing or its own page).
- Login page and Sign-up page (Supabase Auth: email/password to start).
POST-AUTH (requires login — protect these routes):
- Dashboard (role-aware: player sees their stuff, coach sees their squad).
- Player: profile, session logging, development plan view, progress/charts.
- Coach: squad overview, per-player view, set focus/directive, attention list.
- Shared: account/settings, logout.

AUTH MODEL:
- Use real Supabase Auth (email/password first; Google optional later).
- Users have a role: "player" or "coach". Store role in a profiles table linked
  to the Supabase auth user id. Route/redirect based on role after login.
- Protect all post-auth routes: unauthenticated users get redirected to login.
- Because users are minors, keep sign-up simple and collect minimal data.

## Data model (core objects)
- Profile: id (= Supabase auth user id), role ("player" | "coach"), displayName.
- Player: id, name, age, position (striker/midfielder/defender/goalkeeper),
  currentFocus, goal, language.
- Session: id, playerId, date, plain-language note, parsed structured metrics
  (passing, finishing, dribbling, stamina, weakFoot), fatigue/mood, optional
  meal photo reference + fueling feedback.
- CoachInput: id, playerId, focusDirective, notes.
Everything else (trends, plans, curves) is DERIVED by the LLM at request time,
not stored.

## The JSON contract (the interface between frontend and backend)
The generate-plan endpoint must return exactly this shape:
```
Plan {
  trends: { skill: string, direction: "up" | "flat" | "down" }[]
  mismatchFlag: { present: boolean, message: string } | null
  nextFocus: { skill: string, reasoning: string }
  drillPlan: { drill: string, target: string, why: string }[]
}
```
Keep the shared TypeScript types for Player, Session, CoachInput, and Plan in
one file (e.g. src/types.ts) so both people build against the same contract.

## Core server endpoints (this IS the app)
- POST /api/parse-session — takes plain-language log, LLM parses to structured
  JSON, saves to Supabase.
- POST /api/generate-plan — pulls the player's full session history + coach
  directive from Supabase, builds one prompt, LLM detects trends, reconciles
  coach-vs-reality, outputs the Plan JSON above.
- POST /api/meal-feedback — takes a meal photo, multimodal LLM returns
  QUALITATIVE fueling feedback (see safety rules).
- (optional) POST /api/mentor-chat — conversational Q&A for the player.

## Memory approach
No vector DB, no fancy retrieval. "Memory" = SELECT all sessions for this
player ORDER BY date, and inject that history into the prompt. Weeks of data fit
in the context window. Do not over-engineer this.

## SAFETY RULES (non-negotiable — users are minors)
The diet/fueling feature must be QUALITATIVE, never quantitative:
- NEVER output calorie counts, macros, weight targets, portion prescriptions,
  or any restrictive eating advice.
- Frame everything as "fueling for football" and positive habits, not dieting.
- Feedback is encouraging and additive ("add some veg to round it out"), never
  restrictive or shaming.
- Always keep a coach/parent in the loop; for anything medical, point to a
  qualified professional rather than advising.
- All player-facing content stays age-appropriate and encouraging.
Performance feedback rule: never discourage a late-developer or issue a "hard
cut." The AI advises; the human coach decides. Frame feedback as "try this,"
not "you're behind."

## Build priority (build in this order — do NOT jump ahead)
Tier 1 (core spine, build + get working end-to-end FIRST):
  1. Player profile setup (with position)
  2. Plain-language session logging → parsed to structured data
  3. Football metric tracking (passing, finishing, dribbling, stamina, weakFoot)
  4. AI adaptive development plan (history + coach directive → next plan)
  5. Trend detection across weeks
  6. Two-sided reconciliation flag (coach focus vs player logs)
  7. Separate player view and coach view
Tier 2 (depth, only after Tier 1 works):
  8. Position-specific benchmarks
  9. Mentor chat
  10. Development curves / charts (Recharts)
  11. Squad aggregation for coach ("who needs attention this week")
  12. Auto weekly progress report
  13. Photo-based qualitative meal/fueling feedback
Tier 3 (stretch, only if solid):
  14. Multilingual + low-bandwidth mode
  15. Overtraining/load flag
  16. Next-best-focus recommender

## Working style for this codebase
- This is the developer's FIRST real project. Prefer clear, simple, readable
  code over clever abstractions. Explain non-obvious choices in brief comments.
- Build in small pieces that each work before moving on. Do not scaffold all
  16 features at once.
- This is scoped as a real product: build real Supabase Auth and both public
  (pre-auth) and authenticated (post-auth) pages.
- IMPORTANT SEQUENCING: the AI core loop (log -> parse -> plan -> reconcile) is
  the differentiator and the riskiest part. Build and prove that loop working
  FIRST (even on a single seeded player before auth is fully wired), THEN wrap
  the product shell (landing pages, auth, navigation, polish) around it. Do not
  spend the first several days only on landing pages and login flows.
- Still seed one fictional player with ~3 weeks of history so the "it remembered
  and adapted" moment is instant and demoable.
- When unsure about a product decision, ask rather than guessing.