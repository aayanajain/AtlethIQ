// src/lib/sessionTypes.ts
//
// The kinds of session a player can log. The choice drives which fields the
// log shows. `usesDrills` marks the two types where the drill library appears.

import type { SessionType } from "@/src/types";

export const SESSION_TYPES: {
  id: SessionType;
  label: string;
  emoji: string;
  usesDrills: boolean;
}[] = [
  { id: "match", label: "Match", emoji: "⚽", usesDrills: false },
  { id: "team", label: "Team training", emoji: "🧑‍🏫", usesDrills: true },
  { id: "solo", label: "Solo practice", emoji: "🎯", usesDrills: true },
  { id: "gym", label: "Gym / S&C", emoji: "🏋️", usesDrills: false },
  { id: "fitness", label: "Fitness / running", emoji: "🏃", usesDrills: false },
  { id: "recovery", label: "Recovery / rest", emoji: "😴", usesDrills: false },
];

export function sessionTypeLabel(id: SessionType): string {
  return SESSION_TYPES.find((t) => t.id === id)?.label ?? id;
}
