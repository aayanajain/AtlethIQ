"use client";
// src/components/AttributeRadar.tsx
//
// "Game shape" radar — the player's CURRENT level across all of their role's
// attributes (not just the signature 3). Each attribute's level is the average
// of its last 3 ratings. A quick, visual read of where the player is strong and
// where there's room to grow. Muted teal, dark design system, Recharts.

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { Session } from "@/src/types";
import type { Attribute } from "@/src/lib/positions";

// Average of an attribute's last 3 ratings (sessions are newest-first).
function recentLevel(sessions: Session[], key: string): number {
  const vals: number[] = [];
  for (const s of sessions) {
    const v = s.metrics?.[key];
    if (typeof v === "number") vals.push(v);
    if (vals.length === 3) break;
  }
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Short label for the radar spokes (the full labels are too long to fit).
function shortLabel(label: string): string {
  return label.split(/\s*[&/]\s*| under | between /)[0].trim();
}

export function AttributeRadar({
  sessions,
  attrs,
}: {
  sessions: Session[];
  attrs: Attribute[];
}) {
  const data = attrs.map((a) => ({
    attribute: shortLabel(a.label),
    value: Number(recentLevel(sessions, a.key).toFixed(1)),
  }));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="#ffffff14" />
          <PolarAngleAxis dataKey="attribute" tick={{ fill: "#ffffffb3", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            fill="#ffffff"
            fillOpacity={0.16}
            dot={{ r: 2.5, fill: "#ffffff" }}
            // Grow the shape out from a dot in the centre on load.
            isAnimationActive
            animationBegin={150}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
