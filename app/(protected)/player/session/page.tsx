"use client";
// app/(protected)/player/session/page.tsx
//
// "Today's Session" — the position-aware, drill-based logging journey.
//
// Screens:
//   1. type   — pick the session type (match / team / solo / gym / …)
//   2. input  — type-specific: (team/solo) tap drill chips + reflection + effort
//               & mood; others just reflection + effort & mood
//   3. rate   — (match/team/solo only) the AI proposes ratings for your role's
//               attributes; you tweak them, then save.
//
// One session per day: if today's already logged, we show a "done" screen.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import type { Player, Position, SessionType, SessionMetrics } from "@/src/types";
import { ROLE_ATTRIBUTES, roleLabel } from "@/src/lib/positions";
import { SESSION_TYPES } from "@/src/lib/sessionTypes";
import { suggestDrills, drillLabel } from "@/src/lib/drills";
import { todayKey } from "@/src/lib/dates";

// Which session types produce role-attribute ratings (the football ones).
const RATED_TYPES: SessionType[] = ["match", "team", "solo"];

// In development we allow multiple logs per day so it's easy to test. In a
// production build this is false, so the once-per-day rule still applies.
const DEV = process.env.NODE_ENV !== "production";

type Screen = "type" | "input" | "rate" | "feedback";

export default function TodaySessionPage() {
  const router = useRouter();

  const [player, setPlayer] = useState<Player | null>(null);
  const [alreadyLogged, setAlreadyLogged] = useState(false);
  const [loading, setLoading] = useState(true);

  const [screen, setScreen] = useState<Screen>("type");
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [drills, setDrills] = useState<string[]>([]);
  const [customDrill, setCustomDrill] = useState("");
  const [reflection, setReflection] = useState("");
  const [effort, setEffort] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);

  // Attribute ratings gathered from the AI (across the reflection + follow-ups).
  const [ratings, setRatings] = useState<SessionMetrics>({});
  // The player's answers to follow-up questions for attributes not yet rated.
  const [followups, setFollowups] = useState<Record<string, string>>({});

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The coach's instant reaction, shown after saving.
  const [feedback, setFeedback] = useState<{ reaction: string; tip: string } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: mine } = await supabase.from("players").select("*").limit(1).maybeSingle();
      setPlayer((mine as Player) ?? null);
      if (mine) {
        const { data: todays } = await supabase
          .from("sessions")
          .select("id")
          .eq("date", todayKey())
          .limit(1);
        setAlreadyLogged((todays?.length ?? 0) > 0);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Session types that offer a tap-list of activities: drills (team/solo) or
  // exercises (gym/fitness).
  const showActivities =
    sessionType === "team" ||
    sessionType === "solo" ||
    sessionType === "gym" ||
    sessionType === "fitness";
  const activityNoun =
    sessionType === "gym" || sessionType === "fitness" ? "exercises" : "drills";
  const isRated = sessionType !== null && RATED_TYPES.includes(sessionType);
  const inputComplete = reflection.trim() !== "" && effort !== null && mood !== null;

  function toggleDrill(id: string) {
    setDrills((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  function addCustomDrill() {
    const label = customDrill.trim();
    if (label && !drills.includes(label)) setDrills((prev) => [...prev, label]);
    setCustomDrill("");
  }

  // From the input screen: rated types → ask the AI, then go to "rate".
  // Non-rated types → save straight away.
  async function handleContinue() {
    if (!player || !sessionType || effort === null || mood === null) return;
    setBusy(true);
    setError(null);

    if (!isRated) {
      await saveSession({}); // no attribute ratings for gym/fitness/recovery
      return;
    }

    try {
      const res = await fetch("/api/parse-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: reflection, position: player.position, drills }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setBusy(false);
        return;
      }
      setRatings((data.metrics as SessionMetrics) ?? {});
      setScreen("rate");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  // Insert the session (client-side; RLS + the ownerId default handle ownership).
  async function saveSession(metrics: SessionMetrics) {
    if (!player || !sessionType || effort === null || mood === null) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("sessions").insert({
      playerId: player.id,
      date: todayKey(),
      sessionType,
      drills,
      note: reflection,
      metrics,
      effort,
      mood,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Saved — show the coach's instant feedback (instead of jumping to the
    // dashboard). The player taps "Back to dashboard" when they've read it.
    setScreen("feedback");
    fetchFeedback(metrics);
  }

  // Ask the AI mentor to react to the session we just saved.
  async function fetchFeedback(metrics: SessionMetrics) {
    if (!player) return;
    setFeedbackLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/session-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: player.position,
          focus: player.currentFocus,
          goal: player.goal,
          sessionType,
          drills,
          note: reflection,
          metrics,
          effort,
          mood,
        }),
      });
      const data = await res.json();
      setFeedback(
        res.ok ? { reaction: data.reaction ?? "", tip: data.tip ?? "" } : { reaction: "", tip: "" }
      );
    } catch {
      setFeedback({ reaction: "", tip: "" });
    } finally {
      setFeedbackLoading(false);
    }
  }

  // For attributes the AI couldn't rate from the reflection, the player answers
  // a short follow-up question each; we send those answers back to the AI to
  // rate them, then save. (No manual sliders — the AI always does the rating.)
  async function handleFollowupsAndSave() {
    if (!player) return;
    setBusy(true);
    setError(null);

    const attrs = ROLE_ATTRIBUTES[player.position];
    const unrated = attrs.filter((a) => ratings[a.key] === undefined);
    const note = unrated
      .map((a) => `${a.label}: ${(followups[a.key] ?? "").trim()}`)
      .join(". ");

    try {
      const res = await fetch("/api/parse-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, position: player.position, drills }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setBusy(false);
        return;
      }
      // Merge the newly-rated attributes and save.
      const merged = { ...ratings, ...(data.metrics as SessionMetrics) };
      await saveSession(merged);
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  if (loading) return <div className="p-8 text-zinc-500">Loading…</div>;

  if (!player) {
    return (
      <div className="p-8">
        <p className="text-zinc-600 dark:text-zinc-400">Set up your profile first.</p>
        <Link href="/player/setup" className="mt-2 inline-block text-sm font-medium text-emerald-600 hover:underline">
          Set up profile →
        </Link>
      </div>
    );
  }

  if (alreadyLogged && !DEV) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">You&apos;ve logged today</h1>
        <p className="mt-1 text-zinc-500">Nice work — come back tomorrow to keep your streak going.</p>
        <Link href="/player" className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const attributes = ROLE_ATTRIBUTES[player.position];
  const ratedAttrs = attributes.filter((a) => ratings[a.key] !== undefined);
  const unratedAttrs = attributes.filter((a) => ratings[a.key] === undefined);
  const allFollowupsAnswered = unratedAttrs.every(
    (a) => (followups[a.key] ?? "").trim() !== ""
  );

  return (
    <div className="mx-auto max-w-md p-6">
      {/* ---------- Screen 1: pick a session type ---------- */}
      {screen === "type" && (
        <>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">What did you do today?</h1>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {SESSION_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSessionType(t.id);
                  setScreen("input");
                }}
                className="rounded-2xl border border-zinc-200 p-4 text-left transition hover:border-emerald-500 dark:border-zinc-800"
              >
                <div className="text-2xl">{t.emoji}</div>
                <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">{t.label}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ---------- Screen 2: type-specific input ---------- */}
      {screen === "input" && sessionType && (
        <>
          <button
            onClick={() => {
              setScreen("type");
              setSessionType(null);
              setDrills([]);
            }}
            className="text-sm text-zinc-500 hover:underline"
          >
            ← Change type
          </button>

          {/* Drills (team/solo) or exercises (gym/fitness) */}
          {showActivities && (
            <section className="mt-4">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Which {activityNoun} did you do?
              </h2>
              <p className="text-sm text-zinc-500">
                Tap the ones you did
                {sessionType === "team" || sessionType === "solo"
                  ? " — suggested for your role first."
                  : "."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestDrills(sessionType as "team" | "solo" | "gym" | "fitness", player.position).map((d) => (
                  <Chip key={d.id} active={drills.includes(d.id)} onClick={() => toggleDrill(d.id)}>
                    {d.label}
                  </Chip>
                ))}
                {/* Custom ones already added */}
                {drills
                  .filter(
                    (id) =>
                      !suggestDrills(sessionType as "team" | "solo" | "gym" | "fitness", player.position).some(
                        (d) => d.id === id
                      )
                  )
                  .map((id) => (
                    <Chip key={id} active onClick={() => toggleDrill(id)}>
                      {drillLabel(id)}
                    </Chip>
                  ))}
              </div>
              {/* Add your own */}
              <div className="mt-2 flex gap-2">
                <input
                  value={customDrill}
                  onChange={(e) => setCustomDrill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomDrill();
                    }
                  }}
                  placeholder={`+ add your own ${activityNoun === "exercises" ? "exercise" : "drill"}`}
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                <button
                  type="button"
                  onClick={addCustomDrill}
                  className="rounded-lg border border-zinc-300 px-3 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Add
                </button>
              </div>
            </section>
          )}

          {/* Reflection */}
          <section className="mt-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">How did it go?</h2>
            <p className="text-sm text-zinc-500">A line or two in your own words — the AI turns it into your ratings.</p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={4}
              placeholder={reflectionPlaceholder(sessionType)}
              className="mt-2 w-full resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </section>

          {/* Effort + mood */}
          <section className="mt-6 space-y-4">
            <div>
              <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Effort <span className="text-zinc-400">(1 easy → 10 maximal)</span>
              </span>
              <RatingPicker value={effort} onChange={setEffort} activeColor="bg-amber-500" />
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Mood <span className="text-zinc-400">(1 low → 10 great)</span>
              </span>
              <RatingPicker value={mood} onChange={setMood} activeColor="bg-emerald-600" />
            </div>
          </section>

          <button
            onClick={handleContinue}
            disabled={!inputComplete || busy}
            className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Working…" : isRated ? "Analyse my session →" : "Save session"}
          </button>
          {error && <p className="mt-2 text-center text-sm text-red-600">Error: {error}</p>}
        </>
      )}

      {/* ---------- Screen 3: AI ratings + follow-up questions ---------- */}
      {screen === "rate" && (
        <>
          <button onClick={() => setScreen("input")} className="text-sm text-zinc-500 hover:underline">
            ← Back
          </button>
          <h1 className="mt-3 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Your {roleLabel(player.position)} ratings
          </h1>

          {/* What the AI could rate straight from your reflection */}
          {ratedAttrs.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-zinc-500">From your reflection:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ratedAttrs.map((a) => (
                  <span
                    key={a.key}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  >
                    {a.label} {ratings[a.key]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {unratedAttrs.length > 0 ? (
            // Ask a quick follow-up for anything the reflection didn't cover.
            <div className="mt-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                A couple of quick questions so I can rate the rest:
              </p>
              <div className="mt-3 space-y-3">
                {unratedAttrs.map((a) => (
                  <label key={a.key} className="block">
                    <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      How was your {a.label.toLowerCase()} today?
                    </span>
                    <input
                      value={followups[a.key] ?? ""}
                      onChange={(e) =>
                        setFollowups((prev) => ({ ...prev, [a.key]: e.target.value }))
                      }
                      placeholder="a few words…"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                    />
                  </label>
                ))}
              </div>

              <button
                onClick={handleFollowupsAndSave}
                disabled={busy || !allFollowupsAnswered}
                className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? "Rating…" : "Rate these & save"}
              </button>
            </div>
          ) : (
            // Everything got rated from the reflection — just save.
            <button
              onClick={() => saveSession(ratings)}
              disabled={busy}
              className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save session"}
            </button>
          )}
          {error && <p className="mt-2 text-center text-sm text-red-600">Error: {error}</p>}
        </>
      )}

      {/* ---------- Feedback: the coach's instant reaction ---------- */}
      {screen === "feedback" && (
        <div className="py-6 text-center">
          <div className="text-4xl">✅</div>
          <h1 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Session logged!
          </h1>

          {feedbackLoading ? (
            <p className="mt-4 text-sm text-zinc-500">Your coach is looking at it…</p>
          ) : feedback && (feedback.reaction || feedback.tip) ? (
            <div className="mt-5 space-y-3 text-left">
              {feedback.reaction && (
                <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                  {feedback.reaction}
                </div>
              )}
              {feedback.tip && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                  💡 {feedback.tip}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Nice work — keep it up!</p>
          )}

          <button
            onClick={() => router.push("/player")}
            className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Back to dashboard
          </button>
        </div>
      )}
    </div>
  );
}

// Type-specific hint for the reflection box.
function reflectionPlaceholder(type: SessionType): string {
  switch (type) {
    case "match":
      return "How did you play? Key moments, what went well, what to work on…";
    case "team":
      return "e.g. kept losing it under pressure early, but switched play well and read a lot of their passes";
    case "solo":
      return "What you worked on and how it felt…";
    case "gym":
      return "What you trained and how it felt…";
    case "fitness":
      return "The running/fitness you did and how you felt…";
    case "recovery":
      return "What you did to recover and how your body feels…";
  }
}

// A tappable chip (for drills).
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1.5 text-sm transition " +
        (active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900")
      }
    >
      {children}
    </button>
  );
}

// A row of 1–10 buttons.
function RatingPicker({
  value,
  onChange,
  activeColor,
}: {
  value: number | null;
  onChange: (n: number) => void;
  activeColor: string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value === n;
        return (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            className={
              "h-8 w-8 rounded-lg text-sm font-medium transition " +
              (active
                ? activeColor + " text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700")
            }
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
