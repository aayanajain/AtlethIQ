"use client";
// app/(protected)/player/session/page.tsx
//
// "Today's Session" — the position-aware, drill-based logging journey.
//
// The type picker is a full page of image cards. Tapping a card opens a STEPPED
// MODAL that collects the log in pages (drills → reflection → effort & mood →,
// for football sessions, the AI ratings), then saves and shows the coach's
// instant feedback. All the original logic is intact — it's just presented as a
// wizard now.
//
// One session per day: if today's already logged, we show a "done" screen.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/src/lib/supabase";
import type { SessionType, SessionMetrics, Player } from "@/src/types";
import { ROLE_ATTRIBUTES, roleLabel } from "@/src/lib/positions";
import { SESSION_TYPES, SESSION_TYPE_IMAGE } from "@/src/lib/sessionTypes";
import { suggestDrillsByCategory, isCustomDrill, drillLabel } from "@/src/lib/drills";
import { todayKey, computeStreak } from "@/src/lib/dates";

// Which session types produce role-attribute ratings (the football ones).
const RATED_TYPES: SessionType[] = ["match", "team", "solo"];

// Shared dark input styling.
const INPUT_DARK =
  "w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white " +
  "placeholder-white/30 outline-none transition focus:border-green-500/60";

// The wizard's pages, in order (some are skipped depending on the session type).
type StepKey = "activities" | "reflection" | "effortMood" | "rate";

export default function TodaySessionPage() {
  const router = useRouter();

  const [player, setPlayer] = useState<Player | null>(null);
  const [alreadyLogged, setAlreadyLogged] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // The modal is open exactly when a session type is picked.
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const [drills, setDrills] = useState<string[]>([]);
  const [customDrill, setCustomDrill] = useState("");
  const [reflection, setReflection] = useState("");
  const [effort, setEffort] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);

  // Attribute ratings gathered from the AI (across the reflection + follow-ups).
  const [ratings, setRatings] = useState<SessionMetrics>({});
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
        const { data: rows } = await supabase.from("sessions").select("date");
        const dates = (rows ?? []).map((r) => r.date as string);
        setAlreadyLogged(dates.includes(todayKey()));
        setStreak(computeStreak(dates));
      }
      setLoading(false);
    }
    load();
  }, []);

  const showActivities =
    sessionType === "team" ||
    sessionType === "solo" ||
    sessionType === "gym" ||
    sessionType === "fitness";
  const activityNoun =
    sessionType === "gym" || sessionType === "fitness" ? "exercises" : "drills";
  const isRated = sessionType !== null && RATED_TYPES.includes(sessionType);

  // Open the modal fresh for a chosen type.
  function pickType(t: SessionType) {
    setSessionType(t);
    setStepIndex(0);
    setShowFeedback(false);
    setDrills([]);
    setCustomDrill("");
    setReflection("");
    setEffort(null);
    setMood(null);
    setRatings({});
    setFollowups({});
    setError(null);
  }

  function closeModal() {
    setSessionType(null);
    setStepIndex(0);
    setShowFeedback(false);
    setError(null);
  }

  function toggleDrill(id: string) {
    setDrills((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  function addCustomDrill() {
    const label = customDrill.trim();
    if (label && !drills.includes(label)) setDrills((prev) => [...prev, label]);
    setCustomDrill("");
  }

  // Ask the AI to rate the role's attributes from the reflection, then advance
  // to the "rate" step. (Rated types only.)
  async function runParse() {
    if (!player || !sessionType) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: reflection, position: player.position, drills }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setRatings((data.metrics as SessionMetrics) ?? {});
      setStepIndex((i) => i + 1);
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
    setShowFeedback(true);
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
          goal: player.goals?.[0] || "", // Use first goal from array
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
  // a short follow-up each; we send those back to the AI, then save.
  async function handleFollowupsAndSave() {
    if (!player) return;
    setBusy(true);
    setError(null);

    const attrs = ROLE_ATTRIBUTES[player.position];
    const unrated = attrs.filter((a) => ratings[a.key] === undefined);
    const note = unrated.map((a) => `${a.label}: ${(followups[a.key] ?? "").trim()}`).join(". ");

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
      await saveSession({ ...ratings, ...(data.metrics as SessionMetrics) });
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  if (loading) return <div className="p-8 text-white/50">Loading…</div>;

  if (!player) {
    return (
      <div className="p-8">
        <p className="text-white/60">Set up your profile first.</p>
        <Link href="/player/getting-started" className="mt-2 inline-block text-sm font-medium text-teal-400 hover:underline">
          Set up profile →
        </Link>
      </div>
    );
  }

  if (alreadyLogged) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="mt-3 text-2xl font-bold text-white">You&apos;ve logged today</h1>
        <p className="mt-1 text-white/50">Nice work — come back tomorrow to keep your streak going.</p>
        <Link href="/player" className="mt-4 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-black hover:bg-green-500">
          Back to dashboard
        </Link>
      </div>
    );
  }

  // ── Wizard bookkeeping (only meaningful while the modal is open) ────────
  const attributes = ROLE_ATTRIBUTES[player.position];
  const ratedAttrs = attributes.filter((a) => ratings[a.key] !== undefined);
  const unratedAttrs = attributes.filter((a) => ratings[a.key] === undefined);
  const allFollowupsAnswered = unratedAttrs.every((a) => (followups[a.key] ?? "").trim() !== "");

  const steps: StepKey[] = [
    ...(showActivities ? (["activities"] as StepKey[]) : []),
    "reflection",
    "effortMood",
    ...(isRated ? (["rate"] as StepKey[]) : []),
  ];
  const currentKey = steps[stepIndex] ?? "reflection";

  const stepTitle =
    currentKey === "activities"
      ? `Which ${activityNoun} did you do?`
      : currentKey === "reflection"
      ? "How did it go?"
      : currentKey === "effortMood"
      ? "Effort & mood"
      : `Your ${roleLabel(player.position)} ratings`;

  let canProceed = true;
  if (currentKey === "reflection") canProceed = reflection.trim() !== "";
  else if (currentKey === "effortMood") canProceed = effort !== null && mood !== null;
  else if (currentKey === "rate") canProceed = unratedAttrs.length === 0 || allFollowupsAnswered;

  let nextLabel = "Next Step ›";
  if (currentKey === "effortMood") nextLabel = isRated ? "Analyse ›" : "Save session";
  else if (currentKey === "rate") nextLabel = unratedAttrs.length > 0 ? "Rate & save" : "Save session";
  if (busy) nextLabel = "Working…";

  function handleBack() {
    if (stepIndex === 0) closeModal();
    else setStepIndex((i) => i - 1);
  }

  async function handleNext() {
    if (currentKey === "activities" || currentKey === "reflection") {
      setStepIndex((i) => i + 1);
    } else if (currentKey === "effortMood") {
      if (isRated) await runParse();
      else await saveSession({});
    } else if (currentKey === "rate") {
      if (unratedAttrs.length > 0) await handleFollowupsAndSave();
      else await saveSession(ratings);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-12">
      {/* ── Type picker (always the background) ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-white">What did you do?</h1>
          <p className="mt-2 max-w-md text-sm text-white/50">
            Select your activity type to log performance metrics, effort level, and recovery
            status for today&apos;s session.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-green-400">
            Current streak
          </div>
          <div className="text-sm font-semibold text-white/80">
            {streak} {streak === 1 ? "day" : "days"}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {SESSION_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => pickType(t.id)}
            className="group relative h-52 overflow-hidden rounded-2xl border border-white/10 text-left transition hover:border-green-500/50"
          >
            <Image
              src={SESSION_TYPE_IMAGE[t.id]}
              alt={t.label}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <span className="absolute bottom-5 left-6 text-2xl font-bold text-white drop-shadow">
              {t.label}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ── The logging modal ── */}
      {sessionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex h-[600px] max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e] shadow-2xl"
          >
            {showFeedback ? (
              /* ---- Coach's instant feedback ---- */
              <div className="flex h-full flex-col p-8">
                <div className="flex flex-col items-center justify-center pb-6 pt-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="mt-6 text-lg font-black uppercase tracking-widest text-white">Session Logged!</h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {feedbackLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-white/50">Your coach is looking at it…</p>
                    </div>
                  ) : feedback && (feedback.reaction || feedback.tip) ? (
                    <div className="space-y-6">
                      {feedback.reaction && (
                        <div className="flex gap-4 px-2">
                          <div className="text-xl">🏆</div>
                          <p className="text-sm leading-relaxed text-white/85">{feedback.reaction}</p>
                        </div>
                      )}

                      {feedback.tip && (
                        <div className="flex gap-4 border-l-2 border-green-500 bg-white/[0.03] p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 text-black">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-green-500">
                              Pro Tip
                            </h4>
                            <p className="mt-1 text-sm italic leading-relaxed text-white/70">
                              &quot;{feedback.tip}&quot;
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-around pb-4 pt-4">
                        <div className="text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Mood</div>
                          <div className="mt-2 font-bold">
                            <span className="text-2xl text-amber-500">{mood}</span>
                            <span className="text-sm text-white/40"> /10</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Intensity Score</div>
                          <div className="mt-2 font-bold">
                            <span className="text-2xl text-amber-500">{effort}</span>
                            <span className="text-sm text-white/40"> /10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center">
                      <p className="text-sm text-white/50">Nice work — keep it up!</p>
                      <div className="mt-8 flex w-full justify-around">
                        <div className="text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Mood</div>
                          <div className="mt-2 font-bold">
                            <span className="text-2xl text-amber-500">{mood}</span>
                            <span className="text-sm text-white/40"> /10</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Intensity Score</div>
                          <div className="mt-2 font-bold">
                            <span className="text-2xl text-amber-500">{effort}</span>
                            <span className="text-sm text-white/40"> /10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 pt-4">
                  <button
                    onClick={() => router.push("/player")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3.5 text-sm font-bold text-black transition hover:bg-green-400"
                  >
                    Back to dashboard
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header: back + title, with the step progress on the right */}
                <div className="shrink-0 px-6 pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBack}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
                        aria-label="Back"
                      >
                        ←
                      </button>
                      <h2 className="text-xl font-bold text-white">{stepTitle}</h2>
                    </div>
                    <div className="shrink-0 whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-white/40">
                      Step {stepIndex + 1} of {steps.length}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/10" />

                {/* Body: the current step (scrolls if it's tall) */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {currentKey === "activities" && (
                    <div>
                      <p className="text-sm text-white/50">
                        {sessionType === "team" || sessionType === "solo"
                          ? "Tap the ones you did — suggested for your role first."
                          : "Tap all that apply."}
                      </p>

                      {/* Drills grouped into a few broad categories */}
                      {suggestDrillsByCategory(
                        sessionType as "team" | "solo" | "gym" | "fitness",
                        player.position
                      ).map((cat) => (
                        <div key={cat.category} className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-widest text-green-400">
                            {cat.category}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {cat.drills.map((d) => (
                              <Chip
                                key={d.id}
                                active={drills.includes(d.id)}
                                onClick={() => toggleDrill(d.id)}
                              >
                                {d.label}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Player-added ("add your own") drills */}
                      {drills.filter(isCustomDrill).length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-widest text-green-400">
                            Your own
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {drills.filter(isCustomDrill).map((id) => (
                              <Chip key={id} active onClick={() => toggleDrill(id)}>
                                {drillLabel(id)}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-5 flex gap-2">
                        <input
                          value={customDrill}
                          onChange={(e) => setCustomDrill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomDrill();
                            }
                          }}
                          placeholder={`+ add a custom ${activityNoun === "exercises" ? "exercise" : "drill"}`}
                          className={INPUT_DARK}
                        />
                        <button
                          type="button"
                          onClick={addCustomDrill}
                          className="shrink-0 rounded-lg border border-white/15 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  {currentKey === "reflection" && (
                    <div>
                      <p className="text-sm text-white/50">
                        A line or two in your own words — the AI turns it into your ratings.
                      </p>
                      <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        rows={5}
                        placeholder={reflectionPlaceholder(sessionType)}
                        className={INPUT_DARK + " mt-3 resize-none"}
                      />
                    </div>
                  )}

                  {currentKey === "effortMood" && (
                    <div className="space-y-5">
                      <div>
                        <span className="mb-2 block text-sm font-medium text-white/70">
                          Effort <span className="text-white/40">(1 easy → 10 maximal)</span>
                        </span>
                        <RatingPicker value={effort} onChange={setEffort} activeColor="bg-amber-500" />
                      </div>
                      <div>
                        <span className="mb-2 block text-sm font-medium text-white/70">
                          Mood <span className="text-white/40">(1 low → 10 great)</span>
                        </span>
                        <RatingPicker value={mood} onChange={setMood} activeColor="bg-green-600" />
                      </div>
                    </div>
                  )}

                  {currentKey === "rate" && (
                    <div>
                      {ratedAttrs.length > 0 && (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-widest text-green-400">
                            From your session
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {ratedAttrs.map((a) => (
                              <span
                                key={a.key}
                                className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm font-medium text-green-300"
                              >
                                {a.label} {ratings[a.key]}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                      {unratedAttrs.length > 0 && (
                        <div className="mt-5">
                          <p className="text-sm text-white/60">
                            A couple of quick questions so I can rate the rest:
                          </p>
                          <div className="mt-3 space-y-3">
                            {unratedAttrs.map((a) => (
                              <label key={a.key} className="block">
                                <span className="mb-1 block text-sm font-medium text-white/70">
                                  How was your {a.label.toLowerCase()} today?
                                </span>
                                <input
                                  value={followups[a.key] ?? ""}
                                  onChange={(e) =>
                                    setFollowups((prev) => ({ ...prev, [a.key]: e.target.value }))
                                  }
                                  placeholder="a few words…"
                                  className={INPUT_DARK}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {error && <p className="mt-4 text-sm text-red-400">Error: {error}</p>}
                </div>

                {/* Footer: cancel + next */}
                <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-6 py-4">
                  <button
                    onClick={closeModal}
                    className="text-sm font-medium text-white/50 transition hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!canProceed || busy}
                    className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-40"
                  >
                    {nextLabel}
                  </button>
                </div>
              </>
            )}
          </motion.div>
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

// A tappable chip (dark; green when selected, with a check).
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
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition " +
        (active
          ? "border-green-500 bg-green-500/10 text-green-300"
          : "border-white/15 text-white/70 hover:border-white/30 hover:text-white")
      }
    >
      {active && <span className="mr-1.5 text-green-400">✓</span>}
      {children}
    </button>
  );
}

// A row of 1–10 buttons (dark).
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
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value === n;
        return (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            className={
              "h-9 w-9 rounded-lg text-sm font-medium transition " +
              (active
                ? activeColor + " text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10")
            }
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
