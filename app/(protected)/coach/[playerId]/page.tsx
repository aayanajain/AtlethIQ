"use client";
// app/(protected)/coach/[playerId]/page.tsx
//
// Coach's view of ONE player. This is a "dynamic route": the [playerId] in the
// folder name means one file serves every player (/coach/abc, /coach/xyz...).
// We read the id from the URL, load that player, and lay out where the AI Plan
// will go (trends, mismatch flag, next focus, drills — matching the Plan type).
// Those sections are placeholders until /api/generate-plan exists.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import type { Player } from "@/src/types";
import { Card, Badge, SectionTitle } from "@/src/components/ui";

export default function CoachPlayerDetailPage() {
  // useParams() reads the dynamic parts of the URL. The key "playerId" matches
  // the folder name [playerId].
  const params = useParams();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [focus, setFocus] = useState(""); // coach's focus directive (not saved yet)

  // Load this specific player by id.
  useEffect(() => {
    async function loadPlayer() {
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId) // "where id = playerId"
        .maybeSingle();

      setPlayer((data as Player) ?? null);
      setLoading(false);
    }
    loadPlayer();
  }, [playerId]);

  if (loading) {
    return <main className="mx-auto max-w-2xl px-6 py-6 text-zinc-500">Loading…</main>;
  }

  if (!player) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-6">
        <p className="text-zinc-600 dark:text-zinc-400">Player not found.</p>
        <Link href="/coach" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
          ← Back to squad
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-6">
      {/* Back link */}
      <Link href="/coach" className="text-sm text-indigo-600 hover:underline">
        ← Back to squad
      </Link>

      {/* Player header */}
      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {player.name}
        </h1>
        <Badge color="indigo">{player.position}</Badge>
        <span className="text-sm text-zinc-500">age {player.age}</span>
      </div>
      {player.currentFocus && (
        <p className="mt-1 text-sm text-zinc-500">
          Current focus: {player.currentFocus}
        </p>
      )}

      {/* Coach sets a focus directive (UI only — saving comes with CoachInput) */}
      <section className="mt-6">
        <SectionTitle>Set focus for this player</SectionTitle>
        <Card className="mt-2">
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. build up fitness for the next 2 weeks"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            disabled
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Save directive (coming soon)
          </button>
        </Card>
      </section>

      {/* The AI Plan will render here. Placeholders mirror the Plan type. */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <SectionTitle>AI development plan</SectionTitle>
          <button
            disabled
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Generate plan
          </button>
        </div>

        <div className="mt-2 space-y-3">
          <PlanPlaceholder title="Trends" hint="How each skill is moving over recent weeks" />
          <PlanPlaceholder title="Mismatch flag" hint="Where your focus and the player's logs disagree" />
          <PlanPlaceholder title="Next focus" hint="What the AI suggests working on next, and why" />
          <PlanPlaceholder title="Drill plan" hint="Specific drills with targets and reasons" />
        </div>

        <p className="mt-3 text-center text-xs text-zinc-400">
          Plan generation connects once the AI is wired up.
        </p>
      </section>
    </main>
  );
}

// A greyed-out stand-in for one section of the future AI Plan.
function PlanPlaceholder({ title, hint }: { title: string; hint: string }) {
  return (
    <Card className="opacity-70">
      <div className="font-medium text-zinc-900 dark:text-zinc-50">{title}</div>
      <div className="mt-0.5 text-sm text-zinc-500">{hint}</div>
    </Card>
  );
}
