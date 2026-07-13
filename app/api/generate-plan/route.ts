// app/api/generate-plan/route.ts
//
// The AI development plan (server-only). Reads the logged-in player's full
// session history and returns a Plan tailored to a HORIZON — what they're
// planning for: their next session, the week, a match, or a tournament.
//
// SAFETY (minors): encouraging, "try this" not "you're behind", no diet talk.

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabase } from "@/src/lib/supabase/server";
import { ROLE_ATTRIBUTES, roleLabel } from "@/src/lib/positions";
import { drillLabel, DRILLS } from "@/src/lib/drills";
import { sessionTypeLabel } from "@/src/lib/sessionTypes";
import type {
  Player,
  Session,
  Plan,
  PlanHorizon,
  Trend,
  TrendDirection,
  MismatchFlag,
  NextFocus,
  DrillPlan,
  ScheduleItem,
} from "@/src/types";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const HORIZONS = ["next-session", "week", "match", "tournament"];

function asRecord(x: unknown): Record<string, unknown> {
  return x && typeof x === "object" ? (x as Record<string, unknown>) : {};
}

// Horizon-specific instructions for the AI.
function horizonGuidance(
  horizon: PlanHorizon,
  ctx: { opponent: string; homeAway: string; games: string }
): string {
  switch (horizon) {
    case "next-session":
      return `Plan for their NEXT single training session. Keep it tight: 1-2 focuses and 2-3 drills to do next time. No schedule needed (return "schedule": []).`;
    case "week":
      return `Plan the coming WEEK across their sessions. Spread the focuses so they don't overtrain one area, and mind recovery. Include a light day-by-day "schedule".`;
    case "match":
      return `Prepare them for an upcoming MATCH (${ctx.opponent || "unknown"}-level opponent, ${ctx.homeAway || "unknown"} game). Focus on READINESS and sharpening — light work and fresh legs, NOT heavy development. Give their role-specific job vs this opponent and a confident mindset. A short "schedule" of the days before the match helps.`;
    case "tournament":
      return `Prepare them for a TOURNAMENT of ${ctx.games || "several"} games over several days. Focus on PEAKING, recovery between games, staying sharp, and per-game mentality. Include a game/day-by-day "schedule".`;
  }
}

function coercePlan(parsed: unknown): Plan {
  const p = asRecord(parsed);
  const dirs = new Set(["up", "flat", "down"]);

  const trends: Trend[] = Array.isArray(p.trends)
    ? p.trends
        .map(asRecord)
        .filter((t) => typeof t.skill === "string" && typeof t.direction === "string" && dirs.has(t.direction as string))
        .map((t) => ({ skill: t.skill as string, direction: t.direction as TrendDirection }))
    : [];

  let mismatchFlag: MismatchFlag | null = null;
  const mf = asRecord(p.mismatchFlag);
  if (typeof mf.present === "boolean" && typeof mf.message === "string") {
    mismatchFlag = { present: mf.present, message: mf.message };
  }

  const nf = asRecord(p.nextFocus);
  const nextFocus: NextFocus =
    typeof nf.skill === "string" && typeof nf.reasoning === "string"
      ? { skill: nf.skill, reasoning: nf.reasoning }
      : { skill: "", reasoning: "" };

  const drillPlan: DrillPlan[] = Array.isArray(p.drillPlan)
    ? p.drillPlan
        .map(asRecord)
        .filter((d) => typeof d.drill === "string" && typeof d.target === "string" && typeof d.why === "string")
        .map((d) => ({ drill: d.drill as string, target: d.target as string, why: d.why as string }))
    : [];

  const schedule: ScheduleItem[] = Array.isArray(p.schedule)
    ? p.schedule
        .map(asRecord)
        .filter((s) => typeof s.label === "string" && typeof s.focus === "string")
        .map((s) => ({ label: s.label as string, focus: s.focus as string }))
    : [];

  const summary = typeof p.summary === "string" ? p.summary : undefined;

  return {
    summary,
    trends,
    mismatchFlag,
    nextFocus,
    drillPlan,
    schedule: schedule.length ? schedule : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const b = (await request.json()) ?? {};
    const horizonRaw = b.horizon;
    if (typeof horizonRaw !== "string" || !HORIZONS.includes(horizonRaw)) {
      return NextResponse.json({ error: "A valid plan horizon is required." }, { status: 400 });
    }
    const horizon = horizonRaw as PlanHorizon;

    const ctx = asRecord(b.context);
    const context = {
      opponent: typeof ctx.opponent === "string" ? ctx.opponent : "",
      homeAway: typeof ctx.homeAway === "string" ? ctx.homeAway : "",
      games:
        typeof ctx.games === "number"
          ? String(ctx.games)
          : typeof ctx.games === "string"
          ? ctx.games
          : "",
    };
    // An optional free-text note from the player asking to tailor the plan to
    // something specific (e.g. "I keep getting nutmegged"). Trimmed + capped.
    const message = typeof ctx.message === "string" ? ctx.message.trim().slice(0, 400) : "";

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

    const { data: playerRow } = await supabase.from("players").select("*").limit(1).maybeSingle();
    if (!playerRow) {
      return NextResponse.json({ error: "No player profile found." }, { status: 400 });
    }
    const player = playerRow as Player;

    const { data: sessionRows } = await supabase
      .from("sessions")
      .select("*")
      .order("date", { ascending: true });
    const sessions = (sessionRows as Session[]) ?? [];
    if (sessions.length === 0) {
      return NextResponse.json(
        { error: "Log a few sessions first — there's nothing to build a plan from yet." },
        { status: 400 }
      );
    }

    const attrs = ROLE_ATTRIBUTES[player.position];
    const attrLabels = attrs.map((a) => a.label);

    const history = sessions
      .map((s) => {
        const ratings = s.metrics
          ? Object.entries(s.metrics)
              .map(([k, v]) => `${attrs.find((a) => a.key === k)?.label ?? k} ${v}`)
              .join(", ")
          : "";
        const drillsTxt = (s.drills ?? []).map(drillLabel).join(", ");
        const type = s.sessionType ? sessionTypeLabel(s.sessionType) : "session";
        return `- ${s.date} [${type}] drills: ${drillsTxt || "none"}; ratings: ${ratings || "none"}; effort ${s.effort ?? "?"}, mood ${s.mood ?? "?"}; note: ${s.note}`;
      })
      .join("\n");

    const recommendable = DRILLS.filter(
      (d) => d.sessionTypes.includes("team") || d.sessionTypes.includes("solo")
    ).map((d) => d.label);

    const system = `
You are a football (soccer) development coach for a YOUTH ${roleLabel(player.position)} (aged 10-18).
Their focus: ${player.currentFocus || "not set"}. Their goal: ${player.goal || "not set"}.

THIS PLAN'S PURPOSE:
${horizonGuidance(horizon, context)}
${message ? `\nThe player specifically asked you to tailor this plan to: "${message}". Weave this into the nextFocus and drillPlan where it fits (stay age-appropriate and football-specific).` : ""}

Assess these attributes (use these EXACT labels for "skill"):
${attrLabels.map((l) => "- " + l).join("\n")}

Using the training history, produce a plan as JSON EXACTLY:
{
  "summary": string,
  "trends": [{ "skill": string, "direction": "up" | "flat" | "down" }],
  "mismatchFlag": { "present": boolean, "message": string } | null,
  "nextFocus": { "skill": string, "reasoning": string },
  "drillPlan": [{ "drill": string, "target": string, "why": string }],
  "schedule": [{ "label": string, "focus": string }]
}

Guidance:
- "summary": one short line saying what this plan is for.
- "trends": one entry per attribute with enough evidence (labels above).
- "mismatchFlag": present=true with a short message ONLY for a real concern
  (e.g. a plateau, or repeated high effort + low mood suggesting fatigue); else null.
- "nextFocus": the single most useful thing to work on next for this purpose, with encouraging reasoning.
- "drillPlan": 2-4 drills that fit the purpose. Prefer these real drills where they fit: ${recommendable.join(", ")}.
- "schedule": follow the plan purpose above (include for week/tournament; [] if not needed).

Rules (user is a minor): encouraging, "try this" not "you're behind",
age-appropriate, football-specific, no diet/weight talk. Respond with ONLY the JSON.
`.trim();

    const completion = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Training history (oldest first):\n${history}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "The AI did not return valid JSON. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ plan: coercePlan(parsed) });
  } catch (err) {
    console.error("generate-plan failed:", err);
    return NextResponse.json({ error: "Something went wrong building your plan." }, { status: 500 });
  }
}
