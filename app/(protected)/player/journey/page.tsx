"use client";
// app/(protected)/player/journey/page.tsx
//
// Journey — the player's development history. A stats banner up top, then a
// week/month collapsible timeline of rich SESSION cards and the PLANS the
// player kept ("Save to journey"). Dark/teal system, reusing the session-type
// images.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/src/lib/supabase";
import type { Plan, PlanHorizon, Player, Session } from "@/src/types";
import { ROLE_ATTRIBUTES } from "@/src/lib/positions";
import { sessionTypeLabel, SESSION_TYPE_IMAGE } from "@/src/lib/sessionTypes";
import { computeStreak, isThisWeek } from "@/src/lib/dates";

type GroupMode = "week" | "month";

const HORIZON_LABEL: Record<PlanHorizon, string> = {
  "next-session": "Next session",
  week: "This week",
  match: "Match prep",
  tournament: "Tournament",
};

// The plan-card thumbnail per horizon (same images the Plan page uses).
const HORIZON_IMAGE: Record<PlanHorizon, string> = {
  "next-session": "/next.png",
  week: "/week.png",
  match: "/match.png",
  tournament: "/tornament.png",
};

type PlanRow = { id: string; horizon: PlanHorizon; plan: Plan; created_at: string };

type Entry =
  | { kind: "session"; ts: number; date: Date; session: Session }
  | { kind: "plan"; ts: number; date: Date; row: PlanRow };

type Group = { key: string; label: string; entries: Entry[] };

export default function JourneyPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [mode, setMode] = useState<GroupMode>("week");
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const { data: mine } = await supabase.from("players").select("*").limit(1).maybeSingle();
      const me = (mine as Player) ?? null;
      setPlayer(me);

      if (me) {
        const [{ data: sess }, { data: pl }] = await Promise.all([
          supabase.from("sessions").select("*").order("date", { ascending: false }),
          supabase.from("plans").select("id, horizon, plan, created_at").order("created_at", { ascending: false }),
        ]);

        const sessionEntries: Entry[] = ((sess as Session[]) ?? []).map((s) => {
          const d = localDate(s.date);
          return { kind: "session", ts: d.getTime(), date: d, session: s };
        });
        const planEntries: Entry[] = ((pl as PlanRow[]) ?? []).map((row) => {
          const d = new Date(row.created_at);
          return { kind: "plan", ts: d.getTime(), date: d, row };
        });

        setEntries([...sessionEntries, ...planEntries].sort((a, b) => b.ts - a.ts));
      }
      setLoading(false);
    }
    load();
  }, []);

  const groups = useMemo(() => groupEntries(entries, mode), [entries, mode]);

  const firstKey = groups[0]?.key;
  useEffect(() => {
    if (firstKey) setOpenKeys(new Set([firstKey]));
  }, [mode, firstKey]);

  // ── Derived stats for the banner ──────────────────────────────────────
  const sessions = useMemo(
    () => entries.filter((e): e is Extract<Entry, { kind: "session" }> => e.kind === "session").map((e) => e.session),
    [entries]
  );
  const stats = useMemo(() => computeStats(sessions), [sessions]);

  if (loading) return <div className="p-8 text-white/50">Loading…</div>;

  const attrLabel = (key: string) =>
    player ? ROLE_ATTRIBUTES[player.position].find((a) => a.key === key)?.label ?? key : key;

  const toggleGroup = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="mx-auto max-w-[920px] px-4 py-6 sm:px-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/player"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Back to dashboard"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Your journey</h1>
      </div>

      {/* ── Stats banner ── */}
      <div className="mt-6 grid grid-cols-2 gap-y-6 divide-white/10 py-4 sm:flex sm:items-center sm:divide-x">
        <Kpi label="Total sessions" value={String(stats.total)} valueClass="text-white" />
        <Kpi
          label="Avg. performance"
          value={stats.avg != null ? stats.avg.toFixed(1) : "—"}
          unit={stats.avg != null ? "/10" : undefined}
          valueClass="text-green-400"
        />
        <Kpi label="Day streak" value={String(stats.streak)} valueClass="text-amber-300" />
        <WeekRing days={stats.daysThisWeek} />
      </div>

      {/* ── Section head + toggle ── */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">History</h2>
        {entries.length > 0 && (
          <div className="flex shrink-0 rounded-lg border border-white/10 p-0.5">
            {(["week", "month"] as GroupMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  "rounded-md px-3 py-1 text-xs font-medium capitalize transition " +
                  (mode === m ? "bg-teal-500/15 text-teal-300" : "text-white/50 hover:text-white/80")
                }
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-white/50">Nothing here yet.</p>
          <Link href="/player/session" className="mt-3 inline-block text-sm font-medium text-teal-300 hover:underline">
            Log your first session →
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {groups.map((g) => {
            const open = openKeys.has(g.key);
            const sc = g.entries.filter((e) => e.kind === "session").length;
            const pc = g.entries.length - sc;
            return (
              <div key={g.key} className="border-b border-white/[0.06] pb-3 last:border-b-0">
                {/* Group header */}
                <button onClick={() => toggleGroup(g.key)} className="flex w-full items-center gap-3 py-2 text-left">
                  <Chevron open={open} />
                  <span className="text-sm font-semibold text-white">{g.label}</span>
                  <span className="text-xs text-white/35">
                    {sc > 0 && `${sc} session${sc > 1 ? "s" : ""}`}
                    {sc > 0 && pc > 0 && " · "}
                    {pc > 0 && `${pc} plan${pc > 1 ? "s" : ""}`}
                  </span>
                </button>

                {/* Group body */}
                {open && (
                  <div className="relative mt-2 pl-1">
                    <div className="absolute bottom-4 left-[8px] top-4 w-px bg-white/10" />
                    <div className="space-y-4">
                      {g.entries.map((e) => (
                        <div
                          key={e.kind === "session" ? "s-" + e.session.id : "p-" + e.row.id}
                          className="relative flex items-start gap-4"
                        >
                          <div
                            className={
                              "relative z-10 mt-5 h-3.5 w-3.5 shrink-0 rounded-full border-2 bg-[#050505] " +
                              (e.kind === "plan" ? "border-teal-400" : "border-green-500")
                            }
                          />
                          <div className="min-w-0 flex-1">
                            {e.kind === "session" ? (
                              <SessionCard session={e.session} attrLabel={attrLabel} />
                            ) : (
                              <PlanCard
                                row={e.row}
                                open={expanded === e.row.id}
                                onToggle={() => setExpanded(expanded === e.row.id ? null : e.row.id)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Stats banner pieces ─────────────────────────────────────────────── */

function Kpi({
  label,
  value,
  unit,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  unit?: string;
  valueClass?: string;
}) {
  return (
    <div className="px-6 first:pl-0 sm:flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{label}</div>
      <div className="mt-2 flex items-baseline gap-0.5">
        <span className={"text-3xl font-bold " + valueClass}>{value}</span>
        {unit && <span className="text-sm text-white/40">{unit}</span>}
      </div>
    </div>
  );
}

// A small activity ring: days trained this week out of 7 — a graphic, not a graph.
function WeekRing({ days }: { days: number }) {
  const total = 7;
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, days / total);
  return (
    <div className="flex items-center gap-3 px-6 first:pl-0 sm:flex-1">
      <div className="relative h-[58px] w-[58px] shrink-0">
        <svg viewBox="0 0 58 58" className="h-[58px] w-[58px] -rotate-90">
          <circle cx="29" cy="29" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
          <circle
            cx="29"
            cy="29"
            r={r}
            fill="none"
            stroke="#22c55e"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-lg font-bold text-white">{days}</span>
        </div>
      </div>
      <div className="text-[10px] font-semibold uppercase leading-tight tracking-[0.16em] text-white/40">
        This
        <br />
        week
      </div>
    </div>
  );
}

/* ─── Session card ────────────────────────────────────────────────────── */

function SessionCard({
  session,
  attrLabel,
}: {
  session: Session;
  attrLabel: (key: string) => string;
}) {
  const type = session.sessionType ? sessionTypeLabel(session.sessionType) : "Session";
  const image = session.sessionType ? SESSION_TYPE_IMAGE[session.sessionType] : "/card2.png";
  const ratings = Object.entries(session.metrics ?? {}).slice(0, 4);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-32 shrink-0 sm:h-auto sm:w-44">
          <Image src={image} alt={type} fill sizes="(max-width: 640px) 100vw, 176px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-[#0a0a0c]" />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-300">
                Session · {longDate(session.date)}
              </div>
              <div className="mt-1 text-lg font-semibold text-white">{type}</div>
            </div>
            <div className="shrink-0 text-right">
              {session.effort != null && (
                <span
                  className={
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold " +
                    (session.effort >= 8
                      ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                      : "border-green-500/25 bg-green-500/10 text-green-300")
                  }
                >
                  Effort {session.effort}/10
                </span>
              )}
              {session.mood != null && (
                <div className="mt-1 text-[11px] text-white/40">Mood: {moodLabel(session.mood)}</div>
              )}
            </div>
          </div>

          {session.note && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">{session.note}</p>
          )}

          {ratings.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
              {ratings.map(([key, val]) => (
                <div key={key} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="truncate text-xs text-white/50">{attrLabel(key)}</span>
                    <span className="text-xs font-bold text-white">{val}</span>
                  </div>
                  <div className="mt-1 h-[3px] rounded-full bg-white/10">
                    <div
                      className={"h-full rounded-full " + ratingColor(val)}
                      style={{ width: `${(val / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Saved-plan card ─────────────────────────────────────────────────── */

function PlanCard({ row, open, onToggle }: { row: PlanRow; open: boolean; onToggle: () => void }) {
  const { plan } = row;
  const image = HORIZON_IMAGE[row.horizon];
  return (
    <div className="overflow-hidden rounded-2xl border border-teal-500/15 bg-teal-500/[0.04]">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative h-32 shrink-0 sm:h-auto sm:w-44">
          <Image src={image} alt={HORIZON_LABEL[row.horizon]} fill sizes="(max-width: 640px) 100vw, 176px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-[#0a0f0f]" />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-300">
            Plan · {longDate(row.created_at)}
          </div>
          <div className="mt-1 text-lg font-semibold text-white">{HORIZON_LABEL[row.horizon]} plan</div>
          {plan.nextFocus?.skill && (
            <p className="mt-1 text-sm text-white/60">
              Next focus: <span className="font-medium text-teal-300">{plan.nextFocus.skill}</span>
            </p>
          )}

          <button onClick={onToggle} className="mt-2 text-xs font-medium text-teal-300/80 transition hover:text-teal-200">
            {open ? "Hide details" : "View plan"}
          </button>

          {open && (
            <div className="mt-3 space-y-4 border-t border-white/[0.06] pt-3">
              {plan.nextFocus?.reasoning && (
                <p className="text-sm leading-relaxed text-white/55">{plan.nextFocus.reasoning}</p>
              )}
              {plan.drillPlan?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Drills</div>
                  <ul className="mt-2 space-y-2.5">
                    {plan.drillPlan.map((d, i) => (
                      <li key={i}>
                        <div className="text-sm font-medium text-white">{d.drill}</div>
                        <div className="text-xs text-green-400">{d.target}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.schedule && plan.schedule.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Schedule</div>
                  <div className="mt-2 space-y-1.5">
                    {plan.schedule.map((s, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="w-20 shrink-0 font-medium text-teal-300">{s.label}</span>
                        <span className="text-white/55">{s.focus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Small UI ────────────────────────────────────────────────────────── */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={"h-4 w-4 text-white/40 transition-transform " + (open ? "rotate-90" : "")}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/* ─── Stats computation ───────────────────────────────────────────────── */

function computeStats(sessions: Session[]) {
  const total = sessions.length;
  const dates = sessions.map((s) => s.date);
  const streak = computeStreak(dates);
  const daysThisWeek = new Set(dates.filter(isThisWeek)).size;

  const allRatings = sessions.flatMap((s) => Object.values(s.metrics ?? {})).filter((v) => typeof v === "number");
  const avg = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : null;

  return { total, streak, daysThisWeek, avg };
}

/* ─── Grouping ────────────────────────────────────────────────────────── */

function groupEntries(entries: Entry[], mode: GroupMode): Group[] {
  const groups: Group[] = [];
  const index = new Map<string, Group>();
  for (const e of entries) {
    const { key, label } = mode === "week" ? weekBucket(e.date) : monthBucket(e.date);
    let g = index.get(key);
    if (!g) {
      g = { key, label, entries: [] };
      index.set(key, g);
      groups.push(g);
    }
    g.entries.push(e);
  }
  return groups;
}

function weekBucket(d: Date): { key: string; label: string } {
  const monday = mondayOf(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const mon = monday.toLocaleDateString("default", { month: "short" });
  const sun = sunday.toLocaleDateString("default", { month: "short" });
  const label = sameMonth
    ? `${monday.getDate()} – ${sunday.getDate()} ${sun} ${sunday.getFullYear()}`
    : `${monday.getDate()} ${mon} – ${sunday.getDate()} ${sun} ${sunday.getFullYear()}`;
  return { key: dateKey(monday), label };
}

function monthBucket(d: Date): { key: string; label: string } {
  return {
    key: `${d.getFullYear()}-${d.getMonth()}`,
    label: d.toLocaleDateString("default", { month: "long", year: "numeric" }),
  };
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function mondayOf(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localDate(key: string): Date {
  const [y, m, day] = key.split("-").map(Number);
  return new Date(y, m - 1, day);
}

// "2026-07-12" or ISO → "Jul 12, 2026".
function longDate(value: string): string {
  const d = value.includes("T") ? new Date(value) : localDate(value);
  return d.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" });
}

function ratingColor(v: number): string {
  if (v >= 7) return "bg-green-400";
  if (v >= 5) return "bg-teal-400";
  return "bg-amber-400";
}

function moodLabel(v: number): string {
  if (v >= 8) return "Great";
  if (v >= 6) return "Good";
  if (v >= 4) return "Okay";
  return "Tough";
}
