// src/lib/drills.ts
//
// The drill / exercise library. Players tick what they did (that's a complete
// log; detail is optional). Football drills live under "team" and "solo"
// sessions; "gym" and "fitness" sessions get their own common exercises.
//
// This list is a starting point — the app will let players "add their own" on
// the go, so it grows into each team's real sessions over time.
//
// `roles` is an OPTIONAL hint for auto-suggest ordering: drills matching the
// player's role float to the top. Leaving it off means "relevant to everyone".

import type { Position } from "@/src/types";

export type Drill = {
  id: string;
  label: string;
  group: string;
  /** Which session types this drill/exercise can appear under. */
  sessionTypes: ("team" | "solo" | "gym" | "fitness")[];
  /** Roles this drill is especially relevant to (for suggestion order). */
  roles?: Position[];
};

export const DRILLS: Drill[] = [
  // Warm-up
  { id: "dynamic-stretch", label: "Dynamic stretch", group: "Warm-up", sessionTypes: ["team", "solo"] },
  { id: "ball-mastery", label: "Ball mastery", group: "Warm-up", sessionTypes: ["team", "solo"] },
  { id: "passing-warmup", label: "Passing warm-up", group: "Warm-up", sessionTypes: ["team", "solo"] },

  // Possession & passing
  { id: "rondo-4v1", label: "Rondo 4v1", group: "Possession & passing", sessionTypes: ["team"] },
  { id: "rondo-5v2", label: "Rondo 5v2", group: "Possession & passing", sessionTypes: ["team"], roles: ["defensive-mid", "central-mid"] },
  { id: "rondo-3v1", label: "Rondo 3v1", group: "Possession & passing", sessionTypes: ["team"] },
  { id: "pass-and-move", label: "Pass and move", group: "Possession & passing", sessionTypes: ["team", "solo"], roles: ["defensive-mid", "central-mid"] },
  { id: "passing-patterns", label: "Passing patterns", group: "Possession & passing", sessionTypes: ["team"], roles: ["defensive-mid", "central-mid"] },
  { id: "positional-play", label: "Positional play", group: "Possession & passing", sessionTypes: ["team"], roles: ["defensive-mid", "central-mid"] },
  { id: "keep-ball", label: "Keep-ball", group: "Possession & passing", sessionTypes: ["team"], roles: ["defensive-mid", "central-mid"] },

  // Dribbling & 1v1
  { id: "cone-dribbling", label: "Cone dribbling / slalom", group: "Dribbling & 1v1", sessionTypes: ["team", "solo"], roles: ["winger", "attacking-mid"] },
  { id: "dribbling-1v1", label: "1v1 dribbling", group: "Dribbling & 1v1", sessionTypes: ["team", "solo"], roles: ["winger", "attacking-mid"] },
  { id: "take-ons", label: "Take-ons", group: "Dribbling & 1v1", sessionTypes: ["solo"], roles: ["winger"] },

  // Finishing & attacking
  { id: "receive-turn-shoot", label: "Receive, turn & shoot", group: "Finishing & attacking", sessionTypes: ["team", "solo"], roles: ["striker", "attacking-mid"] },
  { id: "finishing-circuit", label: "Finishing circuit", group: "Finishing & attacking", sessionTypes: ["team", "solo"], roles: ["striker", "winger"] },
  { id: "crossing-finishing", label: "Crossing & finishing", group: "Finishing & attacking", sessionTypes: ["team"], roles: ["striker", "winger", "full-back"] },
  { id: "one-v-one-goal", label: "1v1 to goal", group: "Finishing & attacking", sessionTypes: ["team", "solo"], roles: ["striker"] },
  { id: "shooting-distance", label: "Shooting from distance", group: "Finishing & attacking", sessionTypes: ["team", "solo"], roles: ["attacking-mid", "central-mid"] },
  { id: "attacking-patterns", label: "Attacking patterns", group: "Finishing & attacking", sessionTypes: ["team"], roles: ["striker", "attacking-mid", "winger"] },

  // Defending
  { id: "defending-1v1", label: "1v1 defending", group: "Defending", sessionTypes: ["team"], roles: ["centre-back", "full-back", "defensive-mid"] },
  { id: "defending-2v2", label: "2v2 / 3v3 defending", group: "Defending", sessionTypes: ["team"], roles: ["centre-back", "defensive-mid"] },
  { id: "defending-crosses", label: "Defending crosses", group: "Defending", sessionTypes: ["team"], roles: ["centre-back", "goalkeeper"] },
  { id: "pressing", label: "Pressing / win-it-back", group: "Defending", sessionTypes: ["team"], roles: ["defensive-mid", "striker"] },

  // Small-sided games
  { id: "ssg-3v3", label: "3v3 / 4v4", group: "Small-sided games", sessionTypes: ["team"] },
  { id: "ssg-5v5", label: "5v5", group: "Small-sided games", sessionTypes: ["team"] },
  { id: "ssg-6v6", label: "6v6", group: "Small-sided games", sessionTypes: ["team"] },
  { id: "ssg-7v7", label: "7v7 / 8v8", group: "Small-sided games", sessionTypes: ["team"] },
  { id: "transition-game", label: "Transition game", group: "Small-sided games", sessionTypes: ["team"], roles: ["defensive-mid"] },
  { id: "team-match", label: "Team match / scrimmage", group: "Small-sided games", sessionTypes: ["team"] },

  // Set pieces
  { id: "attacking-set-pieces", label: "Attacking corners / FKs", group: "Set pieces", sessionTypes: ["team"] },
  { id: "defending-set-pieces", label: "Defending set pieces", group: "Set pieces", sessionTypes: ["team"], roles: ["centre-back", "goalkeeper"] },

  // Physical / individual
  { id: "speed-agility", label: "Speed & agility", group: "Physical / individual", sessionTypes: ["team", "solo"] },
  { id: "conditioning", label: "Conditioning runs", group: "Physical / individual", sessionTypes: ["team", "solo"] },
  { id: "weak-foot", label: "Weak-foot work", group: "Physical / individual", sessionTypes: ["team", "solo"] },
  { id: "first-touch", label: "First touch / juggling", group: "Physical / individual", sessionTypes: ["solo"], roles: ["defensive-mid", "central-mid"] },

  // --- Gym / S&C exercises ---
  { id: "gym-squats", label: "Squats", group: "Lower body", sessionTypes: ["gym"] },
  { id: "gym-lunges", label: "Lunges", group: "Lower body", sessionTypes: ["gym"] },
  { id: "gym-deadlifts", label: "Deadlifts", group: "Lower body", sessionTypes: ["gym"] },
  { id: "gym-hip-thrusts", label: "Hip thrusts", group: "Lower body", sessionTypes: ["gym"] },
  { id: "gym-calf-raises", label: "Calf raises", group: "Lower body", sessionTypes: ["gym"] },
  { id: "gym-nordics", label: "Nordic hamstring curls", group: "Lower body", sessionTypes: ["gym"] },
  { id: "gym-bench", label: "Bench press", group: "Upper body", sessionTypes: ["gym"] },
  { id: "gym-pushups", label: "Push-ups", group: "Upper body", sessionTypes: ["gym"] },
  { id: "gym-pullups", label: "Pull-ups", group: "Upper body", sessionTypes: ["gym"] },
  { id: "gym-shoulder-press", label: "Shoulder press", group: "Upper body", sessionTypes: ["gym"] },
  { id: "gym-core", label: "Core / plank", group: "Core", sessionTypes: ["gym"] },
  { id: "gym-twists", label: "Russian twists", group: "Core", sessionTypes: ["gym"] },
  { id: "gym-mobility", label: "Mobility / stretching", group: "Mobility", sessionTypes: ["gym"] },

  // --- Fitness / running exercises ---
  { id: "fit-sprints", label: "Sprints / intervals", group: "Running", sessionTypes: ["fitness"] },
  { id: "fit-steady", label: "Steady run", group: "Running", sessionTypes: ["fitness"] },
  { id: "fit-tempo", label: "Tempo run", group: "Running", sessionTypes: ["fitness"] },
  { id: "fit-long", label: "Long run", group: "Running", sessionTypes: ["fitness"] },
  { id: "fit-hills", label: "Hill sprints", group: "Running", sessionTypes: ["fitness"] },
  { id: "fit-shuttles", label: "Shuttle runs", group: "Speed & agility", sessionTypes: ["fitness"] },
  { id: "fit-beep", label: "Beep test", group: "Speed & agility", sessionTypes: ["fitness"] },
  { id: "fit-ladder", label: "Agility ladder", group: "Speed & agility", sessionTypes: ["fitness"] },
  { id: "fit-recovery-jog", label: "Recovery jog", group: "Running", sessionTypes: ["fitness"] },
];

// Look up a drill's label by id (for showing past sessions).
export function drillLabel(id: string): string {
  return DRILLS.find((d) => d.id === id)?.label ?? id;
}

// True for a player-typed "add your own" drill (its id isn't in the library).
export function isCustomDrill(id: string): boolean {
  return !DRILLS.some((d) => d.id === id);
}

// The library has many fine-grained groups; we roll them up into 2–3 broad
// buckets so the picker shows a few tidy categories instead of a long list.
const BROAD_CATEGORY: Record<string, string> = {
  // Football (team / solo)
  "Warm-up": "Technical",
  "Possession & passing": "Technical",
  "Dribbling & 1v1": "Technical",
  "Finishing & attacking": "Technical",
  Defending: "Tactical",
  "Small-sided games": "Tactical",
  "Set pieces": "Tactical",
  "Physical / individual": "Physical",
  // Gym
  "Lower body": "Strength",
  "Upper body": "Strength",
  Core: "Core & mobility",
  Mobility: "Core & mobility",
  // Fitness
  Running: "Running",
  "Speed & agility": "Speed & agility",
};

const CATEGORY_ORDER = [
  "Technical",
  "Tactical",
  "Physical",
  "Strength",
  "Core & mobility",
  "Running",
  "Speed & agility",
];

// Suggested drills, grouped into the broad categories above (role-relevant
// ones still float to the top within each category).
export function suggestDrillsByCategory(
  sessionType: "team" | "solo" | "gym" | "fitness",
  role: Position
): { category: string; drills: Drill[] }[] {
  const byCat = new Map<string, Drill[]>();
  for (const d of suggestDrills(sessionType, role)) {
    const cat = BROAD_CATEGORY[d.group] ?? d.group;
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(d);
  }
  return CATEGORY_ORDER.filter((c) => byCat.has(c)).map((c) => ({
    category: c,
    drills: byCat.get(c)!,
  }));
}

// Suggested drills for a session type + role: role-relevant ones first, then
// the rest for that session type. Used to pre-load the tap-to-add chips.
export function suggestDrills(
  sessionType: "team" | "solo" | "gym" | "fitness",
  role: Position
): Drill[] {
  const forType = DRILLS.filter((d) => d.sessionTypes.includes(sessionType));
  const relevant = forType.filter((d) => d.roles?.includes(role));
  const rest = forType.filter((d) => !d.roles?.includes(role));
  return [...relevant, ...rest];
}
