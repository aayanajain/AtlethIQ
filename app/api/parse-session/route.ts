// app/api/parse-session/route.ts
//
// The AI rating endpoint (server-only, so the Groq key stays secret).
// It does NOT save anything — it just RATES. Given the player's role, the
// drills they did, and their short reflection, it returns proposed 1–10 ratings
// for the attributes that matter to their role. The client then lets the player
// tweak those and saves the session itself (via Supabase, owner-scoped by RLS).
//
// Key rule (no fabrication): the AI only rates attributes the reflection gives
// real evidence for. Anything it can't judge is left out for the player to set.

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabase } from "@/src/lib/supabase/server";
import { ROLE_ATTRIBUTES } from "@/src/lib/positions";
import { drillLabel } from "@/src/lib/drills";
import type { Position, SessionMetrics } from "@/src/types";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function isValidRating(x: unknown): x is number {
  return typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= 10;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const note: unknown = body?.note;
    const position: unknown = body?.position;
    const drills: unknown = body?.drills;

    if (typeof note !== "string" || note.trim() === "") {
      return NextResponse.json({ error: "A reflection is required." }, { status: 400 });
    }
    if (typeof position !== "string" || !(position in ROLE_ATTRIBUTES)) {
      return NextResponse.json({ error: "A valid position is required." }, { status: 400 });
    }

    // Must be logged in (protects the AI key from anonymous use).
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

    // The attributes worth rating for this role.
    const attributes = ROLE_ATTRIBUTES[position as Position];
    const attrList = attributes.map((a) => `- ${a.key}: ${a.label}`).join("\n");

    // Turn drill ids into readable names for context.
    const drillIds: string[] = Array.isArray(drills)
      ? drills.filter((d): d is string => typeof d === "string")
      : [];
    const drillText = drillIds.length ? drillIds.map(drillLabel).join(", ") : "none specified";

    const system = `
You are a football (soccer) performance analyst for youth players aged 10-18.
For this player's role, these are the only attributes worth rating:
${attrList}

You'll get the drills they did and their own reflection. Rate ONLY the
attributes the reflection gives real evidence for, each an INTEGER from 1 to 10.
If the reflection says nothing about an attribute, OMIT it (never guess).
Respond with ONLY a JSON object mapping attribute keys to numbers.
`.trim();

    const userMsg = `Drills: ${drillText}\n\nReflection: ${note}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "The AI did not return valid JSON. Please try again." },
        { status: 502 }
      );
    }

    // Keep only valid attribute keys with valid 1–10 ratings.
    const allowed = new Set(attributes.map((a) => a.key));
    const metrics: SessionMetrics = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (allowed.has(key) && isValidRating(value)) {
        metrics[key] = value;
      }
    }

    return NextResponse.json({ metrics });
  } catch (err) {
    console.error("parse-session failed:", err);
    return NextResponse.json(
      { error: "Something went wrong analysing the session." },
      { status: 500 }
    );
  }
}
