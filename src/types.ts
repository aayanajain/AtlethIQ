// src/types.ts
//
// Shared TypeScript types for AthletIQ.
// This is the single source of truth for the data shapes that the frontend
// and backend agree on. Both people on the team should import from here so we
// never drift apart on the contract.
//
// The 3 core objects (Player, Session, CoachInput) come straight from the
// data model in CLAUDE.md. `Plan` is the JSON shape the /api/generate-plan
// endpoint must return.

// ---------------------------------------------------------------------------
// Small helper unions
// ---------------------------------------------------------------------------

/**
 * The playing role (position). We use SPECIFIC roles rather than broad
 * positions, because the app tailors which attributes a session is rated on —
 * a #6 (defensive mid) is judged very differently from a striker. The
 * human-friendly labels + each role's attribute set live in
 * src/lib/positions.ts.
 */
export type Position =
  | "goalkeeper"
  | "centre-back"
  | "full-back"
  | "defensive-mid"
  | "central-mid"
  | "attacking-mid"
  | "winger"
  | "striker";

/**
 * Gender options for player profile.
 */
export type Gender = "male" | "female" | "other" | "prefer-not-to-say";

/**
 * Dominant foot preference.
 */
export type DominantFoot = "left" | "right" | "both";

/**
 * Self-assessed fitness level.
 */
export type FitnessLevel = "beginner" | "intermediate" | "advanced";

/**
 * Preferred training time of day.
 */
export type PreferredTime = "morning" | "afternoon" | "evening";

/**
 * Days of the week for training availability.
 */
export type TrainingDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/** What kind of session it was — this drives which fields the log shows. */
export type SessionType =
  | "match"
  | "team"
  | "solo"
  | "gym"
  | "fitness"
  | "recovery";

/**
 * The football skills we track over time. Kept as a named type so the same
 * five skills are reused everywhere (metrics, trends, focus) without retyping.
 */
export type Skill =
  | "passing"
  | "finishing"
  | "dribbling"
  | "stamina"
  | "weakFoot";

/** Which way a skill is moving across recent sessions. */
export type TrendDirection = "up" | "flat" | "down";

// ---------------------------------------------------------------------------
// Core object 1: Player
// ---------------------------------------------------------------------------

/**
 * A footballer using the app (ages 10–39). All content built around a
 * Player must stay age-appropriate and safe.
 * 
 * Updated for comprehensive onboarding flow with personal, football, physical,
 * goals, and availability information.
 */
export interface Player {
  id: string;

  // ── Personal Information ──
  /** Full name of the player. */
  fullName: string;
  /** Date of birth in ISO format (YYYY-MM-DD). */
  dateOfBirth: string;
  /** Gender identity. */
  gender: Gender;

  // ── Football Details ──
  /** The playing role/position. */
  position: Position;
  /** Which foot they prefer to use. */
  dominantFoot: DominantFoot;
  /** How many years they've been playing football. */
  yearsPlaying: number;
  /** Current club or team name (optional). */
  currentClub?: string;

  // ── Physical Details ──
  /** Height in centimeters (optional). */
  height?: number;
  /** Weight in kilograms (optional). */
  weight?: number;
  /** Self-assessed fitness level. */
  fitnessLevel: FitnessLevel;

  // ── Goals ──
  /** 
   * Array of development goals. Can include predefined goals like
   * "Improve overall fitness" or custom goals set by the player.
   */
  goals: string[];

  // ── Availability ──
  /** Days of the week available for training. */
  trainingDays: TrainingDay[];
  /** Preferred time of day for training. */
  preferredTime: PreferredTime;
  /** Preferred session duration in minutes (e.g., 60, 90, 120). */
  sessionDuration: number;

  // ── Meta & Legacy Fields ──
  /** What the player is currently working on, e.g. "weak foot control". */
  currentFocus: string;
  /** Preferred language (for multilingual support later). e.g. "en". */
  language: string;
  /** Whether the player has completed the onboarding wizard. */
  onboardingCompleted: boolean;
  /** When the profile was created. */
  createdAt?: string;
  /** When the profile was last updated. */
  updatedAt?: string;

  // ── Deprecated legacy columns ──
  // Still present on existing DB rows (pre-onboarding-redesign). Kept optional
  // so code that falls back to them (e.g. the coach roster) type-checks. Do NOT
  // use these for new code — use fullName / dateOfBirth / goals instead.
  /** @deprecated use `fullName`. */
  name?: string;
  /** @deprecated use `dateOfBirth`. */
  age?: number;
  /** @deprecated use `goals`. */
  goal?: string;
}

// ---------------------------------------------------------------------------
// Core object 2: Session
// ---------------------------------------------------------------------------

/**
 * The performance ratings for a session: a map of attribute key -> 1–10.
 * The attribute keys depend on the player's role (see ROLE_ATTRIBUTES in
 * src/lib/positions.ts) — e.g. a #6 stores "positioning", "interceptions", etc.
 * Kept flexible (a plain object) so different roles store different attributes
 * without changing this type.
 */
export type SessionMetrics = Record<string, number>;

/**
 * One logged training/match session.
 * The player picks a session type, ticks the drills they did, and writes a
 * short reflection (`note`); the parse-session endpoint reads that and fills in
 * `metrics` (the role's attribute ratings). Meal fields are optional.
 */
export interface Session {
  id: string;
  /** Links this session back to its Player. */
  playerId: string;
  /** ISO date string, e.g. "2026-07-08". Kept as a string for easy sorting. */
  date: string;
  /** What kind of session this was (match, team, solo, ...). */
  sessionType?: SessionType;
  /** The drills the player ticked (drill ids from src/lib/drills.ts). */
  drills?: string[];
  /** The player's short plain-language reflection on the session. */
  note: string;
  /** Performance ratings (attribute key -> 1–10) for the player's role. */
  metrics: SessionMetrics;
  /** Effort / RPE for the whole session (1 = easy, 10 = maximal). */
  effort?: number;
  /** (Legacy) how tired the player felt. Optional now that we use `effort`. */
  fatigue?: number;
  /** How the player felt (1 = low, 10 = great). */
  mood: number;

  // --- Optional fueling fields (Tier 2 feature) ---
  // Only present when the player uploads a meal photo.

  /** Reference to the uploaded meal photo in Supabase Storage. */
  mealPhotoRef?: string;
  /**
   * QUALITATIVE fueling feedback only — never calories, macros, or portions.
   * See the safety rules in CLAUDE.md.
   */
  fuelingFeedback?: string;
}

// ---------------------------------------------------------------------------
// Core object 3: CoachInput
// ---------------------------------------------------------------------------

/**
 * A coach's instruction for a specific player. The generate-plan endpoint
 * reconciles this directive against what the player's sessions actually show,
 * and flags any mismatch (e.g. coach says "push fitness" but logs show fatigue).
 */
export interface CoachInput {
  id: string;
  /** Which Player this input is about. */
  playerId: string;
  /** What the coach wants the player to focus on. */
  focusDirective: string;
  /** Any extra free-text notes from the coach. */
  notes: string;
}

// ---------------------------------------------------------------------------
// The Plan contract (output of POST /api/generate-plan)
// ---------------------------------------------------------------------------
//
// This is the exact JSON shape the backend returns and the frontend renders.
// Everything here is DERIVED by the LLM at request time — it is not stored.
// The interfaces are broken out so each piece is easy to read and reuse.

/** How one skill is trending across the player's recent sessions. */
export interface Trend {
  skill: string;
  direction: TrendDirection;
}

/**
 * A flag raised when the coach's directive doesn't match what the player's
 * logs show (e.g. fatigue, plateau). `null` on the Plan means "no mismatch".
 */
export interface MismatchFlag {
  present: boolean;
  /** Human-readable explanation shown in the UI. */
  message: string;
}

/** The single skill the AI recommends focusing on next, with its reasoning. */
export interface NextFocus {
  skill: string;
  reasoning: string;
}

/** One concrete drill in the plan, with a target and the reason behind it. */
export interface DrillPlan {
  drill: string;
  target: string;
  why: string;
}

/** What the player is planning FOR — this tailors the plan. */
export type PlanHorizon = "next-session" | "week" | "match" | "tournament";

/** One step in a multi-day plan (a day or a session). */
export interface ScheduleItem {
  /** e.g. "Mon", "Session 1", "Game day". */
  label: string;
  /** What to do then. */
  focus: string;
}

/**
 * The development plan returned by /api/generate-plan. The core fields match
 * CLAUDE.md's JSON contract; `summary` and `schedule` are extras that tailor the
 * plan to its horizon (e.g. a week or tournament plan includes a schedule).
 */
export interface Plan {
  /** One-line framing of what this plan is for. */
  summary?: string;
  trends: Trend[];
  /** `null` when there is no coach-vs-reality mismatch to report. */
  mismatchFlag: MismatchFlag | null;
  nextFocus: NextFocus;
  drillPlan: DrillPlan[];
  /** A light day/session-by-session schedule (week & tournament plans). */
  schedule?: ScheduleItem[];
}
