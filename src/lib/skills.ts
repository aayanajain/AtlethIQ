// src/lib/skills.ts
//
// The five tracked football skills, in display order, with a label and a
// helpful placeholder. Kept in one shared place so the logging journey and the
// dashboard/session cards all use the exact same list.

import type { Skill } from "@/src/types";

export const SKILLS: { key: Skill; label: string; placeholder: string }[] = [
  { key: "passing", label: "Passing", placeholder: "e.g. crisp, 30 mins of drills" },
  { key: "finishing", label: "Finishing", placeholder: "e.g. hit a few over the bar" },
  { key: "dribbling", label: "Dribbling", placeholder: "e.g. beat my man a couple of times" },
  { key: "stamina", label: "Stamina", placeholder: "e.g. gassed near the end" },
  { key: "weakFoot", label: "Weak foot", placeholder: "e.g. shaky, needs work" },
];

// A fresh, empty set of skill notes (one blank string per skill).
export const EMPTY_SKILL_NOTES: Record<Skill, string> = {
  passing: "",
  finishing: "",
  dribbling: "",
  stamina: "",
  weakFoot: "",
};
