"use client";
// app/(protected)/player/plan/page.tsx
//
// Progress — the AI development plan, tailored to a HORIZON (what you're
// planning for: next session, the week, a match, or a tournament). You pick the
// horizon (+ a little context for match/tournament), press generate, and the AI
// reads your history and returns a plan.

import { useState } from "react";
import { Card, SectionTitle } from "@/src/components/ui";
import type { Plan, PlanHorizon, TrendDirection } from "@/src/types";

const HORIZONS: { id: PlanHorizon; label: string; emoji: string }[] = [
  { id: "next-session", label: "Next session", emoji: "🎯" },
  { id: "week", label: "This week", emoji: "📅" },
  { id: "match", label: "Match prep", emoji: "⚽" },
  { id: "tournament", label: "Tournament", emoji: "🏆" },
];

export default function PlanPage() {
  const [horizon, setHorizon] = useState<PlanHorizon>("week");
  const [opponent, setOpponent] = useState("even"); // weak | even | strong
  const [homeAway, setHomeAway] = useState("home"); // home | away
  const [games, setGames] = useState("3");

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);

    const context: Record<string, unknown> = {};
    if (horizon === "match") {
      context.opponent = opponent;
      context.homeAway = homeAway;
    }
    if (horizon === "tournament") {
      context.games = Number(games) || games;
    }

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horizon, context }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setPlan(null);
        return;
      }
      setPlan(data.plan as Plan);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Your plan</h1>
      <p className="text-sm text-zinc-500">
        Pick what you&apos;re planning for — the AI tailors it to your history.
      </p>

      {/* Horizon picker */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {HORIZONS.map((h) => (
          <button
            key={h.id}
            onClick={() => setHorizon(h.id)}
            className={
              "rounded-xl border px-4 py-3 text-left text-sm transition " +
              (horizon === h.id
                ? "border-emerald-600 bg-emerald-50 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900")
            }
          >
            <span className="mr-1.5">{h.emoji}</span>
            {h.label}
          </button>
        ))}
      </div>

      {/* Context for match */}
      {horizon === "match" && (
        <div className="mt-4 flex gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Opponent</span>
            <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className={inputClass}>
              <option value="weak">Weaker</option>
              <option value="even">Even</option>
              <option value="strong">Stronger</option>
            </select>
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Venue</span>
            <select value={homeAway} onChange={(e) => setHomeAway(e.target.value)} className={inputClass}>
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
          </label>
        </div>
      )}

      {/* Context for tournament */}
      {horizon === "tournament" && (
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Number of games</span>
          <input
            type="number"
            min={2}
            max={10}
            value={games}
            onChange={(e) => setGames(e.target.value)}
            className={inputClass}
          />
        </label>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Building your plan…" : plan ? "Regenerate plan" : "Generate plan"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* The plan */}
      {plan && (
        <div className="mt-8 space-y-6">
          {plan.summary && (
            <p className="text-sm italic text-zinc-500">{plan.summary}</p>
          )}

          {/* Watch-out flag */}
          {plan.mismatchFlag?.present && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <p className="text-sm text-amber-800 dark:text-amber-200">⚠️ {plan.mismatchFlag.message}</p>
            </Card>
          )}

          {/* Next focus */}
          {plan.nextFocus.skill && (
            <section>
              <SectionTitle>Next focus</SectionTitle>
              <Card className="mt-2 border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
                <div className="font-semibold text-emerald-900 dark:text-emerald-100">{plan.nextFocus.skill}</div>
                <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">{plan.nextFocus.reasoning}</p>
              </Card>
            </section>
          )}

          {/* Schedule (week / tournament) */}
          {plan.schedule && plan.schedule.length > 0 && (
            <section>
              <SectionTitle>Schedule</SectionTitle>
              <ul className="mt-2 space-y-2">
                {plan.schedule.map((s, i) => (
                  <li key={i} className="flex gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                    <span className="w-20 shrink-0 text-sm font-medium text-zinc-900 dark:text-zinc-50">{s.label}</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.focus}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Trends */}
          <section>
            <SectionTitle>Trends</SectionTitle>
            {plan.trends.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Not enough data yet — log more sessions.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {plan.trends.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{t.skill}</span>
                    <TrendArrow direction={t.direction} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Drill plan */}
          {plan.drillPlan.length > 0 && (
            <section>
              <SectionTitle>Drill plan</SectionTitle>
              <ul className="mt-2 space-y-3">
                {plan.drillPlan.map((d, i) => (
                  <li key={i}>
                    <Card>
                      <div className="font-medium text-zinc-900 dark:text-zinc-50">{d.drill}</div>
                      <div className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-400">Target: {d.target}</div>
                      <div className="mt-0.5 text-sm text-zinc-500">{d.why}</div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 " +
  "outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function TrendArrow({ direction }: { direction: TrendDirection }) {
  const map: Record<TrendDirection, { icon: string; cls: string }> = {
    up: { icon: "↑", cls: "text-emerald-600" },
    flat: { icon: "→", cls: "text-zinc-400" },
    down: { icon: "↓", cls: "text-red-500" },
  };
  const { icon, cls } = map[direction];
  return <span className={"text-sm font-semibold " + cls}>{icon} {direction}</span>;
}
