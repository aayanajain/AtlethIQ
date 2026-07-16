"use client";
// app/(protected)/coach/page.tsx
//
// Coach dashboard — the squad overview. It loads the REAL list of players from
// Supabase and shows them as a roster; each row links to that player's detail
// page. "Needs attention" flags depend on the AI, so that count is a
// placeholder for now.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import type { Player } from "@/src/types";
import { Card, Badge, SectionTitle } from "@/src/components/ui";
import { calculateAge } from "@/src/lib/onboarding";

export default function CoachDashboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Load the whole squad once on mount.
  useEffect(() => {
    async function loadSquad() {
      const { data } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: false });

      setPlayers((data as Player[]) ?? []);
      setLoading(false);
    }
    loadSquad();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-6">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold text-indigo-600">Coach</span>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          Log out
        </Link>
      </header>

      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Squad dashboard
      </h1>

      {/* Overview tiles: squad size is real; the rest are placeholders. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <SectionTitle>Squad size</SectionTitle>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {loading ? "—" : players.length}
          </p>
        </Card>
        <Card>
          <SectionTitle>Needs attention</SectionTitle>
          <p className="mt-1 text-2xl font-bold text-zinc-400">—</p>
          <p className="text-xs text-zinc-400">AI flags coming soon</p>
        </Card>
        <Card>
          <SectionTitle>This week</SectionTitle>
          <p className="mt-1 text-2xl font-bold text-zinc-400">—</p>
          <p className="text-xs text-zinc-400">Sessions logged</p>
        </Card>
      </div>

      {/* Roster */}
      <section className="mt-8">
        <SectionTitle>Your players</SectionTitle>

        {loading ? (
          <p className="mt-2 text-zinc-500">Loading…</p>
        ) : players.length === 0 ? (
          <Card className="mt-2 text-center">
            <p className="text-zinc-500">No players yet.</p>
            <Link
              href="/player/getting-started"
              className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Add a player →
            </Link>
          </Card>
        ) : (
          <ul className="mt-2 space-y-2">
            {players.map((p) => (
              <li key={p.id}>
                {/* Each player links to their detail page. */}
                <Link
                  href={`/coach/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      {p.fullName || p.name || "Unknown"}
                    </div>
                    <div className="text-sm text-zinc-500">
                      age {p.dateOfBirth ? calculateAge(p.dateOfBirth) : p.age || "?"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="indigo">{p.position}</Badge>
                    <span className="text-zinc-400">›</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
