"use client";
// app/(protected)/player/page.tsx
//
// Player Dashboard — the overview hub (not the logging form anymore; that lives
// at /player/session now). Shows: greeting + 🔥 streak, a "log today" call to
// action (or a "done" state), a training calendar, and recent sessions.
// All of this is built from the sessions we already store.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import type { Player, Session, Position } from "@/src/types";
import { Card, Badge, SectionTitle } from "@/src/components/ui";
import { ROLE_ATTRIBUTES } from "@/src/lib/positions";
import { sessionTypeLabel } from "@/src/lib/sessionTypes";
import { drillLabel } from "@/src/lib/drills";
import { computeStreak, todayKey } from "@/src/lib/dates";
import { SessionCalendar } from "@/src/components/SessionCalendar";

export default function PlayerDashboardPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: mine } = await supabase.from("players").select("*").limit(1).maybeSingle();
      const me = (mine as Player) ?? null;
      setPlayer(me);

      if (me) {
        const { data: rows } = await supabase
          .from("sessions")
          .select("*")
          .order("date", { ascending: false });
        setSessions((rows as Session[]) ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-zinc-500">Loading…</div>;

  if (!player) {
    return (
      <div className="p-8">
        <p className="text-zinc-600 dark:text-zinc-400">No player profile yet.</p>
        <Link href="/player/setup" className="mt-2 inline-block text-sm font-medium text-emerald-600 hover:underline">
          Set up profile →
        </Link>
      </div>
    );
  }

  // Derive the calendar days, streak, and whether today's done.
  const dates = sessions.map((s) => s.date);
  const loggedDates = new Set(dates);
  const streak = computeStreak(dates);
  const loggedToday = loggedDates.has(todayKey());

  return (
    <div className="mx-auto max-w-lg p-6">
      {/* Greeting + streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Hi, {player.name.split(" ")[0]} 👋
          </h1>
          <Badge color="emerald">{player.position}</Badge>
        </div>
        <div
          title="Day streak"
          className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          🔥 {streak}
        </div>
      </div>

      {/* Log today CTA / done state. In dev we always show the button so we can
          log multiple times a day while testing. */}
      {loggedToday && process.env.NODE_ENV === "production" ? (
        <Card className="mt-6 border-emerald-200 bg-emerald-50 text-center dark:border-emerald-900 dark:bg-emerald-950">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            ✅ You&apos;ve logged today — nice one!
          </p>
        </Card>
      ) : (
        <Link
          href="/player/session"
          className="mt-6 block rounded-2xl bg-emerald-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-emerald-700"
        >
          📝 Log today&apos;s session
        </Link>
      )}

      {/* Training calendar */}
      <section className="mt-8">
        <SectionTitle>Training calendar</SectionTitle>
        <div className="mt-2">
          <SessionCalendar loggedDates={loggedDates} />
        </div>
      </section>

      {/* Recent sessions */}
      <section className="mt-8">
        <SectionTitle>Recent sessions ({sessions.length})</SectionTitle>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No sessions yet — log your first one above.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} role={player.position} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// One past session: type + reflection + drills + the role's attribute ratings.
function SessionCard({ session, role }: { session: Session; role: Position }) {
  const attrs = ROLE_ATTRIBUTES[role];
  const attrLabel = (key: string) => attrs.find((a) => a.key === key)?.label ?? key;
  const metricEntries = Object.entries(session.metrics ?? {});

  return (
    <li>
      <Card>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{session.date}</span>
          {session.sessionType && <span>{sessionTypeLabel(session.sessionType)}</span>}
        </div>

        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          &ldquo;{session.note}&rdquo;
        </p>

        {/* Drills done */}
        {session.drills && session.drills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {session.drills.map((id) => (
              <span
                key={id}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {drillLabel(id)}
              </span>
            ))}
          </div>
        )}

        {/* Attribute ratings */}
        {metricEntries.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {metricEntries.map(([key, val]) => (
              <Badge key={key} color="zinc">
                {attrLabel(key)} {val}
              </Badge>
            ))}
          </div>
        )}

        {/* Effort (or legacy fatigue) + mood */}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {session.effort != null ? (
            <Badge color="amber">Effort {session.effort}</Badge>
          ) : session.fatigue != null ? (
            <Badge color="amber">Fatigue {session.fatigue}</Badge>
          ) : null}
          <Badge color="emerald">Mood {session.mood}</Badge>
        </div>
      </Card>
    </li>
  );
}
