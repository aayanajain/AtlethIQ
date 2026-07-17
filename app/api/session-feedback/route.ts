// app/api/session-feedback/route.ts
//
// The "coach reacts" endpoint (server-only, so the Groq key stays secret).
// Right after a player logs a session, this returns a short, encouraging
// reaction plus ONE concrete tip for next time, tailored to their role + focus.
//
// SAFETY (users are minors — see CLAUDE.md): encouraging and additive only,
// "try this" not "you're behind", age-appropriate, no diet/weight talk.

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabase } from "@/src/lib/supabase/server";
import { ROLE_ATTRIBUTES, roleLabel } from "@/src/lib/positions";
import { drillLabel } from "@/src/lib/drills";
import { sessionTypeLabel } from "@/src/lib/sessionTypes";
import type { Position, SessionType, SessionMetrics } from "@/src/types";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function POST(request: Request) {
  try {
    const b = (await request.json()) ?? {};
    const position: unknown = b.position;
    const focus = typeof b.focus === "string" ? b.focus : "";
    const goal = typeof b.goal === "string" ? b.goal : "";
    const sessionType: unknown = b.sessionType;
    const drills: unknown = b.drills;
    const note = typeof b.note === "string" ? b.note : "";
    const metrics: unknown = b.metrics;
    const effort = b.effort;
    const mood = b.mood;

    // Must be logged in (protects the AI key).
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Server is missing GROQ_API_KEY." }, { status: 500 });
    }

    // Build readable context for the prompt.
    const hasRole = typeof position === "string" && position in ROLE_ATTRIBUTES;
    const role = hasRole ? roleLabel(position as Position) : "player";
    const attrs = hasRole ? ROLE_ATTRIBUTES[position as Position] : [];

    const drillIds: string[] = Array.isArray(drills)
      ? drills.filter((d): d is string => typeof d === "string")
      : [];
    const drillText = drillIds.length ? drillIds.map(drillLabel).join(", ") : "none";

    const ratingText =
      metrics && typeof metrics === "object"
        ? Object.entries(metrics as SessionMetrics)
            .map(([k, v]) => `${attrs.find((a) => a.key === k)?.label ?? k} ${v}/10`)
            .join(", ")
        : "";

    const typeLabel =
      typeof sessionType === "string" ? sessionTypeLabel(sessionType as SessionType) : "session";

    const system = `
You are an encouraging, knowledgeable football (soccer) mentor for a player
(aged 10-39) who plays as a ${role}.
Their current focus: ${focus || "not set"}. Their goal: ${goal || "not set"}.

The player just logged a session. Return:
1) "reaction": a short, warm reaction (2-3 sentences) that reflects what they
   actually did and how it went.
2) "tip": ONE concrete, specific thing to try next time, tied to their role and
   focus.

Rules (the user is a minor — non-negotiable):
- Encouraging and additive. Frame advice as "try this", never "you're behind"
  and never a hard cut. Never discourage a developing player.
- Age-appropriate, specific to football. No diet, calorie, or weight talk.

Respond with ONLY JSON: { "reaction": string, "tip": string }.
`.trim();

    const userMsg = `Session type: ${typeLabel}
Drills/exercises: ${drillText}
Their reflection: ${note || "(none)"}
Attribute ratings: ${ratingText || "(none)"}
Effort: ${effort ?? "?"}/10, Mood: ${mood ?? "?"}/10`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: { reaction?: unknown; tip?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "The AI did not return valid JSON." }, { status: 502 });
    }

    const reaction = typeof parsed.reaction === "string" ? parsed.reaction : "";
    const tip = typeof parsed.tip === "string" ? parsed.tip : "";
    if (!reaction && !tip) {
      return NextResponse.json({ error: "Empty feedback." }, { status: 502 });
    }

    return NextResponse.json({ reaction, tip });
  } catch (err) {
    console.error("session-feedback failed:", err);
    return NextResponse.json({ error: "Something went wrong getting feedback." }, { status: 500 });
  }
}
