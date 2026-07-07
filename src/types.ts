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

/** The four positions we support. Using a union keeps typos out. */
export type Position = "striker" | "midfielder" | "defender" | "goalkeeper";

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
 * A young footballer using the app. Remember: users are minors (ages 10–18),
 * so all content built around a Player must stay age-appropriate.
 */
export interface Player {
  id: string;
  name: string;
  age: number;
  position: Position;
  /** What the player is currently working on, e.g. "weak foot control". */
  currentFocus: string;
  /** The player's own longer-term goal, in their words. */
  goal: string;
  /** Preferred language (for multilingual support later). e.g. "en". */
  language: string;
}

// ---------------------------------------------------------------------------
// Core object 2: Session
// ---------------------------------------------------------------------------

/**
 * The structured metrics an LLM pulls out of the player's plain-language note.
 * These are the five tracked football skills. Values are simple numeric
 * ratings (e.g. 1–10) so we can chart trends over weeks.
 */
export interface SessionMetrics {
  passing: number;
  finishing: number;
  dribbling: number;
  stamina: number;
  weakFoot: number;
}

/**
 * One logged training/match session. The player writes `note` in plain
 * language; the parse-session endpoint fills in `metrics`, `fatigue`, and
 * `mood`. Meal fields are optional and only used by the fueling feature.
 */
export interface Session {
  id: string;
  /** Links this session back to its Player. */
  playerId: string;
  /** ISO date string, e.g. "2026-07-08". Kept as a string for easy sorting. */
  date: string;
  /** The raw plain-language log the player typed in. */
  note: string;
  /** Structured metrics the LLM parsed out of `note`. */
  metrics: SessionMetrics;
  /** How tired the player felt (e.g. 1 = fresh, 10 = exhausted). */
  fatigue: number;
  /** How the player felt (e.g. 1 = low, 10 = great). */
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

/**
 * The full development plan returned by /api/generate-plan.
 * Must match this shape exactly — it is the interface between frontend
 * and backend (see "The JSON contract" in CLAUDE.md).
 */
export interface Plan {
  trends: Trend[];
  /** `null` when there is no coach-vs-reality mismatch to report. */
  mismatchFlag: MismatchFlag | null;
  nextFocus: NextFocus;
  drillPlan: DrillPlan[];
}
