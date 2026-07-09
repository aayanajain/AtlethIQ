// src/lib/positions.ts
//
// The playing roles and, for each, the attributes a session is rated on.
// This is what makes logging position-aware: a #6 gets judged on positioning &
// interceptions, a striker on finishing & movement. The AI uses the player's
// role to decide which attributes to rate from their reflection.

import type { Position } from "@/src/types";

// The selectable roles, with friendly labels (used in the profile dropdown).
export const ROLES: { slug: Position; label: string }[] = [
  { slug: "goalkeeper", label: "Goalkeeper" },
  { slug: "centre-back", label: "Centre-back" },
  { slug: "full-back", label: "Full-back" },
  { slug: "defensive-mid", label: "Defensive mid (#6)" },
  { slug: "central-mid", label: "Central mid (#8)" },
  { slug: "attacking-mid", label: "Attacking mid (#10)" },
  { slug: "winger", label: "Winger" },
  { slug: "striker", label: "Striker" },
];

export type Attribute = { key: string; label: string };

// The attributes each role is rated on (the "what's worth judging" for them).
export const ROLE_ATTRIBUTES: Record<Position, Attribute[]> = {
  goalkeeper: [
    { key: "shotStopping", label: "Shot-stopping" },
    { key: "handling", label: "Handling" },
    { key: "distribution", label: "Distribution" },
    { key: "command", label: "Command of area" },
    { key: "oneVOne", label: "1v1s" },
    { key: "footwork", label: "Footwork" },
  ],
  "centre-back": [
    { key: "aerial", label: "Aerial duels" },
    { key: "defending1v1", label: "1v1 defending" },
    { key: "positioning", label: "Positioning & reading" },
    { key: "tackling", label: "Tackling" },
    { key: "passingOut", label: "Passing out from the back" },
    { key: "strength", label: "Strength" },
  ],
  "full-back": [
    { key: "defending1v1", label: "1v1 defending" },
    { key: "overlapping", label: "Overlapping runs" },
    { key: "crossing", label: "Crossing" },
    { key: "recoveryPace", label: "Recovery pace" },
    { key: "stamina", label: "Stamina" },
    { key: "positioning", label: "Positioning" },
  ],
  "defensive-mid": [
    { key: "positioning", label: "Positioning & screening" },
    { key: "interceptions", label: "Interceptions & reading" },
    { key: "retention", label: "Retention under pressure" },
    { key: "distribution", label: "Distribution" },
    { key: "tackling", label: "Tackling & duels" },
    { key: "scanning", label: "Scanning & awareness" },
  ],
  "central-mid": [
    { key: "passingRange", label: "Passing range" },
    { key: "retention", label: "Retention under pressure" },
    { key: "stamina", label: "Box-to-box stamina" },
    { key: "firstTouch", label: "First touch" },
    { key: "tackling", label: "Tackling" },
    { key: "twoFooted", label: "Two-footedness" },
  ],
  "attacking-mid": [
    { key: "creativity", label: "Final ball / creativity" },
    { key: "tightDribbling", label: "Tight dribbling" },
    { key: "shooting", label: "Shooting" },
    { key: "movement", label: "Movement between lines" },
    { key: "vision", label: "Vision" },
    { key: "firstTouch", label: "First touch" },
  ],
  winger: [
    { key: "dribbling", label: "1v1 dribbling" },
    { key: "pace", label: "Pace / beating your man" },
    { key: "crossing", label: "Crossing" },
    { key: "cuttingIn", label: "Cutting in & finishing" },
    { key: "endProduct", label: "End product" },
    { key: "trackingBack", label: "Tracking back" },
  ],
  striker: [
    { key: "finishing", label: "Finishing" },
    { key: "movement", label: "Off-ball movement" },
    { key: "holdUp", label: "Hold-up / link play" },
    { key: "heading", label: "Heading" },
    { key: "firstTouch", label: "First touch under pressure" },
    { key: "weakFoot", label: "Weak-foot finishing" },
  ],
};

// Helper: the friendly label for a role slug.
export function roleLabel(slug: Position): string {
  return ROLES.find((r) => r.slug === slug)?.label ?? slug;
}
