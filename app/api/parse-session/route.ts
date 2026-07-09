// app/api/parse-session/route.ts
//
// Tier 1 #2 — the FIRST AI endpoint. This runs ONLY on the server, so the Groq
// key never reaches the browser (CLAUDE.md hard rule #1).
//
// The player fills in a guided form: a short line per skill, plus fatigue and
// mood they pick themselves (1–10). So:
//   - The 5 SKILL ratings are decided by the AI, from what the player wrote for
//     each skill (every skill field is required, so the AI never has to guess).
//   - FATIGUE and MOOD are the player's own numbers — feelings are self-reported,
//     not something the AI should infer.
//
// Flow: receive { playerId, note, fatigue, mood } -> AI rates the 5 skills ->
// validate everything is a 1–10 integer -> save to `sessions` -> return the row.
//
// A file named route.ts inside app/api/parse-session/ becomes POST /api/parse-session.

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabase } from "@/src/lib/supabase/server";
import type { SessionMetrics } from "@/src/types";

// The Groq client. Groq's API is OpenAI-compatible, so we use the openai SDK
// but point it at Groq's server. The key is read server-side only.
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Which model to call (overridable in .env.local via GROQ_MODEL).
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// We ask Groq for ONLY the five skills now (fatigue/mood come from the player).
// The word "json" must appear for Groq's JSON mode — it's in here.
const SYSTEM_PROMPT = `
You are a football (soccer) performance analyst for youth players aged 10-18.
You will be given a player's short description of how each of five skills went in
one training session.

Rate each skill as JSON with EXACTLY these keys, each an INTEGER from 1 to 10:
- passing
- finishing
- dribbling
- stamina
- weakFoot   (their weaker foot)

Base each rating only on what the player wrote for that skill. Respond with ONLY
the JSON object, no explanation, no markdown fences.
`.trim();

// The five skills the AI must return.
const SKILL_KEYS = ["passing", "finishing", "dribbling", "stamina", "weakFoot"] as const;

// True only if x is a whole number from 1 to 10.
function isValidRating(x: unknown): x is number {
  return typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= 10;
}

export async function POST(request: Request) {
  try {
    // --- 1. Read and check the request body ---
    const body = await request.json();
    const playerId: unknown = body?.playerId;
    const note: unknown = body?.note;
    const fatigue: unknown = body?.fatigue;
    const mood: unknown = body?.mood;

    if (typeof playerId !== "string" || typeof note !== "string" || note.trim() === "") {
      return NextResponse.json(
        { error: "playerId and a non-empty note are required." },
        { status: 400 }
      );
    }

    // Fatigue + mood are the player's own picks — validate them here (no AI).
    if (!isValidRating(fatigue) || !isValidRating(mood)) {
      return NextResponse.json(
        { error: "fatigue and mood must each be a number from 1 to 10." },
        { status: 400 }
      );
    }

    // Must be logged in. (Middleware guards /player pages, but NOT /api routes,
    // so we check here too.) The server client reads the session from cookies.
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    // Fail clearly if the key isn't set, instead of a confusing SDK error.
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Server is missing GROQ_API_KEY." },
        { status: 500 }
      );
    }

    // --- 2. Ask Groq to rate the five skills as JSON ---
    const completion = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: note },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // --- 3. Safely parse + validate (never trust the model blindly) ---
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "The AI did not return valid JSON. Please try again." },
        { status: 502 }
      );
    }

    // Every skill must be a valid 1–10 integer — no loose data.
    for (const key of SKILL_KEYS) {
      if (!isValidRating(parsed[key])) {
        return NextResponse.json(
          { error: `The AI returned an invalid or missing value for "${key}".` },
          { status: 502 }
        );
      }
    }

    // Build the nested metrics object exactly matching SessionMetrics.
    const metrics: SessionMetrics = {
      passing: parsed.passing as number,
      finishing: parsed.finishing as number,
      dribbling: parsed.dribbling as number,
      stamina: parsed.stamina as number,
      weakFoot: parsed.weakFoot as number,
    };

    // --- 4. Save the session to Supabase ---
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        playerId,
        note,
        metrics,
        fatigue, // the player's own pick
        mood, // the player's own pick
        ownerId: user.id, // tie the session to the logged-in user
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // --- 5. Send the saved session back to the client ---
    return NextResponse.json({ session: data });
  } catch (err) {
    console.error("parse-session failed:", err);
    return NextResponse.json(
      { error: "Something went wrong parsing the session." },
      { status: 500 }
    );
  }
}
