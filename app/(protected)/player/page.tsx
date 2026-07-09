"use client";
// app/(protected)/player/page.tsx
//
// Player Dashboard — the session-logging screen (Tier 1 #2).
// GUIDED inputs: one required line per skill, plus the player's own fatigue &
// mood picks (1–10). Because every skill field is required, the AI always has
// something real to rate — it never fabricates a score.
//
// "Which player am I?" has no real answer until auth exists, so for now we use
// the newest player as the stand-in for the logged-in player.

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import type { Player, Session, Skill } from "@/src/types";
import { Card, Badge, SectionTitle } from "@/src/components/ui";

// The five skills, with a label and a helpful placeholder.
const SKILLS: { key: Skill; label: string; placeholder: string }[] = [
  { key: "passing", label: "Passing", placeholder: "e.g. crisp, 30 mins of drills" },
  { key: "finishing", label: "Finishing", placeholder: "e.g. hit a few over the bar" },
  { key: "dribbling", label: "Dribbling", placeholder: "e.g. beat my man a couple of times" },
  { key: "stamina", label: "Stamina", placeholder: "e.g. gassed near the end" },
  { key: "weakFoot", label: "Weak foot", placeholder: "e.g. shaky, needs work" },
];

// A fresh, empty set of skill notes.
const EMPTY_NOTES: Record<Skill, string> = {
  passing: "",
  finishing: "",
  dribbling: "",
  stamina: "",
  weakFoot: "",
};

export default function PlayerDashboardPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Form state: one note per skill, plus the two feeling picks.
  const [skillNotes, setSkillNotes] = useState<Record<Skill, string>>(EMPTY_NOTES);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: load MY profile (RLS returns only my own row), then my sessions.
  useEffect(() => {
    async function load() {
      const { data: mine } = await supabase
        .from("players")
        .select("*")
        .limit(1)
        .maybeSingle();

      const me = (mine as Player) ?? null;
      setPlayer(me);

      if (me) {
        const { data: rows } = await supabase
          .from("sessions")
          .select("*")
          .eq("playerId", me.id)
          .order("date", { ascending: false });
        setSessions((rows as Session[]) ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Update one skill's note.
  function setSkill(key: Skill, value: string) {
    setSkillNotes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    if (!player) return;

    // Feelings must be chosen (the skill inputs are HTML-required already).
    if (fatigue === null || mood === null) {
      setError("Please pick your fatigue and mood.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Combine the per-skill notes into one labelled note the AI can read.
    const note =
      SKILLS.map((s) => `${s.label}: ${skillNotes[s.key].trim()}`).join(". ") + ".";

    try {
      const res = await fetch("/api/parse-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, note, fatigue, mood }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      // Put the new session on top and reset the form.
      setSessions((prev) => [data.session as Session, ...prev]);
      setSkillNotes(EMPTY_NOTES);
      setFatigue(null);
      setMood(null);
    } catch {
      setError("Could not reach the server. Is the dev server running?");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading…</div>;
  }

  if (!player) {
    return (
      <div className="p-8">
        <p className="text-zinc-600 dark:text-zinc-400">
          No player profile yet. Create one first.
        </p>
        <a href="/player/setup" className="mt-2 inline-block text-sm font-medium text-emerald-600 hover:underline">
          Set up profile →
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      {/* Greeting */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Hi, {player.name.split(" ")[0]} 👋
        </h1>
        <Badge color="emerald">{player.position}</Badge>
      </div>

      {/* --- Guided session composer --- */}
      <section className="mt-6">
        <SectionTitle>Log today&apos;s session</SectionTitle>
        <form onSubmit={handleLog} className="mt-2 space-y-3">
          {/* One required line per skill */}
          {SKILLS.map((s) => (
            <label key={s.key} className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {s.label}
              </span>
              <input
                required
                value={skillNotes[s.key]}
                onChange={(e) => setSkill(s.key, e.target.value)}
                placeholder={s.placeholder}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
          ))}

          {/* Fatigue + mood: the player picks these directly */}
          <div>
            <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              How tired were you? <span className="text-zinc-400">(1 fresh → 10 exhausted)</span>
            </span>
            <RatingPicker value={fatigue} onChange={setFatigue} activeColor="bg-amber-500" />
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              How did you feel? <span className="text-zinc-400">(1 low → 10 great)</span>
            </span>
            <RatingPicker value={mood} onChange={setMood} activeColor="bg-emerald-600" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Reading your session…" : "Send to coach"}
          </button>

          {error && <p className="text-sm text-red-600">Error: {error}</p>}
        </form>
      </section>

      {/* --- Past sessions --- */}
      <section className="mt-8">
        <SectionTitle>Recent sessions ({sessions.length})</SectionTitle>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            No sessions yet — log your first one above.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// A row of 1–10 buttons; the chosen number is highlighted.
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

// One past session: the note + the ratings.
function SessionCard({ session }: { session: Session }) {
  return (
    <li>
      <Card>
        <div className="text-xs text-zinc-400">{session.date}</div>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          &ldquo;{session.note}&rdquo;
        </p>

        {/* The five skill ratings */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SKILLS.map((s) => (
            <Badge key={s.key} color="zinc">
              {s.label} {session.metrics[s.key]}
            </Badge>
          ))}
        </div>

        {/* Fatigue + mood */}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge color="amber">Fatigue {session.fatigue}</Badge>
          <Badge color="emerald">Mood {session.mood}</Badge>
        </div>
      </Card>
    </li>
  );
}
