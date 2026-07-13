"use client";
// app/(protected)/player/page.tsx
//
// Player Dashboard — the daily hub (dark/teal design system).
//
// Layout (adapted from a clean learning-dashboard reference):
//   • Top bar: "quick log" bar + streak + profile avatar.
//   • Hero (FULL WIDTH): greeting + "trained N× this week" + Log CTA, with 3
//     rich SIGNATURE cards (the role's 3 most-defining attributes) on the right.
//   • Below, two columns:
//       main  — last-5-sessions form graph (Recharts), snapshot, recent sessions
//       rail  — training calendar + "Your next focus" (one-tap plan generate)
//
// Sections below the hero are intentionally low-chrome (dividers + whitespace,
// not boxes) so the page reads as one surface, not a grid of cards.

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Player, Session, Plan } from "@/src/types";
import { supabase } from "@/src/lib/supabase";
import { SectionTitle } from "@/src/components/ui";
import {
  ROLE_ATTRIBUTES,
  signatureAttributes,
  type Attribute,
} from "@/src/lib/positions";
import { sessionTypeLabel, SESSION_TYPE_IMAGE } from "@/src/lib/sessionTypes";
import { computeStreak, isThisWeek } from "@/src/lib/dates";
import { SessionCalendar } from "@/src/components/SessionCalendar";
import { AttributeRadar } from "@/src/components/AttributeRadar";

// The three accent colours, shared by the hero cards and the graph lines.
// Deliberately muted (not neon) so the dark dashboard reads calm, not vibrant.
const ACCENTS = ["#2b9488", "#3f9d68", "#c79242"]; // muted teal / green / amber

type Trend = "up" | "flat" | "down";

export default function PlayerDashboardPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  // "Generate this week's plan" CTA state.
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: mine } = await supabase.from("players").select("*").limit(1).maybeSingle();
      const me = (mine as Player) ?? null;
      setPlayer(me);

      if (me) {
        const [{ data: rows }, { data: planRow }] = await Promise.all([
          supabase.from("sessions").select("*").order("date", { ascending: false }),
          supabase.from("plans").select("plan").limit(1).maybeSingle(),
        ]);
        setSessions((rows as Session[]) ?? []);
        setPlan((planRow?.plan as Plan) ?? null);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Ask the AI for a "this week" plan, then cache it (upsert: one row per player).
  async function generateWeekPlan() {
    if (!player) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horizon: "week", context: {} }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error ?? "Couldn't build a plan right now.");
        return;
      }
      const newPlan = data.plan as Plan;
      await supabase.from("plans").upsert(
        { playerId: player.id, horizon: "week", plan: newPlan, updated_at: new Date().toISOString() },
        { onConflict: "playerId" }
      );
      setPlan(newPlan);
    } catch {
      setGenError("Could not reach the server.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div className="p-8 text-white/50">Loading…</div>;

  if (!player) {
    return (
      <div className="p-8">
        <p className="text-white/60">No player profile yet.</p>
        <Link
          href="/player/setup"
          className="mt-2 inline-block text-sm font-medium text-teal-400 hover:underline"
        >
          Set up profile →
        </Link>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────
  const signature = signatureAttributes(player.position);

  const allDates = sessions.map((s) => s.date);
  const loggedDates = new Set(allDates);
  const streak = computeStreak(allDates);

  const ratedSessions = sessions.filter((s) => s.metrics && Object.keys(s.metrics).length > 0);

  const weekDays = new Set(allDates.filter(isThisWeek)).size;
  const roleAttrs = ROLE_ATTRIBUTES[player.position]; // all attributes, for the radar

  return (
    // Desktop: fill the viewport and lock height so nothing scrolls (the graph
    // flexes to absorb the leftover space). Small screens scroll normally.
    <div>
      <div className="mx-auto max-w-[1100px] px-4 py-4 sm:px-6">
        {/* ── Top bar ── */}
        <div className="flex items-center gap-3">
          <Link
            href="/player/session"
            className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/40 transition hover:border-teal-500/40 hover:text-white/70"
          >
            <span>🔍</span>
            <span>How did training go today?</span>
          </Link>
          <div
            title="Day streak"
            className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300"
          >
            🔥 {streak}
          </div>
          <Link
            href="/player/setup"
            title="Your profile"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-semibold text-teal-300 transition hover:border-teal-500/40"
          >
            {initials(player.name)}
          </Link>
        </div>

        {/* ── Hero (full width) ── */}
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-teal-500/[0.07] via-white/[0.02] to-transparent p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            {/* Greeting + CTA */}
            <div>
              <h1 className="text-2xl font-bold text-white">
                Hi, {player.name.split(" ")[0]} 👋
              </h1>
              {player.currentFocus && (
                <p className="mt-2 text-sm text-white/60">
                  Working on:{" "}
                  <span className="font-medium text-teal-300">{player.currentFocus}</span>
                </p>
              )}
              <p className="mt-3 text-lg font-semibold text-white">
                You&apos;ve trained {weekDays}× this week {weekDays > 0 && "🔥"}
              </p>
              <Link
                href="/player/session"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-500"
              >
                📝 Log today&apos;s session
              </Link>
            </div>

            {/* 3 signature attribute cards */}
            <div className="grid grid-cols-3 gap-3">
              {signature.map((a, i) => (
                <SignatureCard
                  key={a.key}
                  index={i}
                  attr={a}
                  level={recentAverage(ratedSessions, a.key)}
                  trend={attrTrend(ratedSessions, a.key)}
                  accent={ACCENTS[i]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Below the hero: radar · last session · rail ── */}
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {/* ---- Left: game-shape radar (small, vertically centred) ---- */}
          <section className="flex flex-col">
            <SectionTitle>Your game shape</SectionTitle>
            <div className="mt-3 flex flex-1 items-center justify-center">
              <div className="h-[280px] w-full max-w-[350px] rounded-2xl bg-white/[0.02] p-2">
                <AttributeRadar sessions={ratedSessions} attrs={roleAttrs} />
              </div>
            </div>
          </section>

          {/* ---- Centre: last session + see-journey CTA ---- */}
          <section className="flex flex-col">
            <SectionTitle>Last session</SectionTitle>
            <div className="mt-3 flex-1">
              <LastSessionCard session={sessions[0] ?? null} />
            </div>
          </section>

          {/* ---- Right: calendar + generate-plan CTA ---- */}
          <div className="flex flex-col gap-4">
            <section>
              <SectionTitle>Training calendar</SectionTitle>
              <div className="mt-3">
                <SessionCalendar loggedDates={loggedDates} />
              </div>
            </section>

            <section className="mt-auto">
              <SectionTitle>Your next focus</SectionTitle>
              <div className="mt-3">
                {plan?.nextFocus?.skill ? (
                  <Link
                    href="/player/plan"
                    className="block w-full rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2.5 text-center text-sm font-semibold text-teal-200 transition hover:bg-teal-500/20"
                  >
                    🧭 See my plan →
                  </Link>
                ) : (
                  <button
                    onClick={generateWeekPlan}
                    disabled={generating || sessions.length === 0}
                    className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-green-500 disabled:opacity-50"
                  >
                    {generating ? "Building your plan…" : "⚡ Generate my plan"}
                  </button>
                )}
                {genError && <p className="mt-2 text-xs text-red-400">{genError}</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Last session card ───────────────────────────────────────────────── */

// The most recent session at a glance, with a "see journey" link to the full
// training history. `session` is null when the player hasn't logged anything.
// The most recent session as a clean image tile: the session-type photo, one
// short line, and a "see journey" link. No border, no separate background — the
// photo is the surface. `session` is null when nothing's been logged yet.
function LastSessionCard({ session }: { session: Session | null }) {
  if (!session) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl text-center">
        <p className="text-sm text-white/50">No sessions yet.</p>
        <Link
          href="/player/session"
          className="mt-3 text-sm font-medium text-teal-300 hover:underline"
        >
          Log your first session →
        </Link>
      </div>
    );
  }

  const image = session.sessionType ? SESSION_TYPE_IMAGE[session.sessionType] : "/card2.png";
  const typeLabel = session.sessionType ? sessionTypeLabel(session.sessionType) : "Session";

  return (
    <div className="relative h-full min-h-[220px] overflow-hidden rounded-2xl">
      <Image
        src={image}
        alt={typeLabel}
        fill
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="text-sm font-semibold text-white">
          {typeLabel} · {shortDate(session.date)}
        </div>
        <Link
          href="/player/journey"
          className="mt-2 inline-block text-sm font-medium text-teal-300 hover:underline"
        >
          See journey →
        </Link>
      </div>
    </div>
  );
}

/* ─── Hero signature card ─────────────────────────────────────────────── */

// One signature attribute: index badge, trend, current level (0–10), progress.
// Each card gets a subtle colour-tinted fill so the three pop like the
// reference cards, while staying on the dark theme.
function SignatureCard({
  index,
  attr,
  level,
  trend,
  accent,
}: {
  index: number;
  attr: Attribute;
  level: number | null;
  trend: Trend | null;
  accent: string;
}) {
  const pct = level != null ? (level / 10) * 100 : 0;
  return (
    <div
      className="flex flex-col rounded-2xl border p-4"
      style={{
        background: `linear-gradient(135deg, ${accent}1c, ${accent}08)`,
        borderColor: `${accent}24`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold" style={{ color: accent }}>
          0{index + 1}
        </span>
        {trend && <TrendMark dir={trend} />}
      </div>
      <div className="mt-3 text-sm font-medium leading-snug text-white/85">{attr.label}</div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color: accent }}>
          {level != null ? level.toFixed(1) : "—"}
        </span>
        <span className="text-xs text-white/40">/ 10</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
      </div>
    </div>
  );
}

// Small trend arrow. "down" is amber, not red — encouraging, never punishing.
function TrendMark({ dir }: { dir: Trend }) {
  const map: Record<Trend, { icon: string; cls: string }> = {
    up: { icon: "↑", cls: "text-green-500/80" },
    flat: { icon: "→", cls: "text-white/40" },
    down: { icon: "↓", cls: "text-amber-500/80" },
  };
  const { icon, cls } = map[dir];
  return <span className={"text-sm font-semibold " + cls}>{icon}</span>;
}

/* ─── Small helpers ───────────────────────────────────────────────────── */

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// "2026-07-12" → "12 Jul" (built from parts so it stays in local time).
function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("default", {
    day: "numeric",
    month: "short",
  });
}

// A signature card's "level": the average of an attribute's last 3 ratings.
function recentAverage(sessionsNewestFirst: Session[], key: string): number | null {
  const vals: number[] = [];
  for (const s of sessionsNewestFirst) {
    const v = s.metrics?.[key];
    if (typeof v === "number") vals.push(v);
    if (vals.length === 3) break;
  }
  return average(vals);
}

// Simple trend from an attribute's two most recent ratings (newest first).
function attrTrend(sessionsNewestFirst: Session[], key: string): Trend | null {
  const vals: number[] = [];
  for (const s of sessionsNewestFirst) {
    const v = s.metrics?.[key];
    if (typeof v === "number") vals.push(v);
    if (vals.length === 2) break;
  }
  if (vals.length < 2) return null;
  const diff = vals[0] - vals[1]; // most recent minus the one before
  if (diff >= 0.5) return "up";
  if (diff <= -0.5) return "down";
  return "flat";
}

// Initials for the profile avatar, e.g. "Kush Sharma" → "KS".
function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
