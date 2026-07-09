"use client";
// app/player/setup/page.tsx
//
// Tier 1 #1 — Player profile setup. (This is the form that used to live at "/".)
// Client component: it talks to Supabase directly with the anon key, which is
// allowed for player data (CLAUDE.md rule #2). No LLM here.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import type { Player, Position } from "@/src/types";

// The four positions, used to build the dropdown. Kept in sync with the
// Position type in one obvious place.
const POSITIONS: Position[] = ["striker", "midfielder", "defender", "goalkeeper"];

export default function PlayerSetupPage() {
  // --- Form state (one piece of state per field) ---
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [position, setPosition] = useState<Position>("striker");
  const [currentFocus, setCurrentFocus] = useState("");
  const [goal, setGoal] = useState("");
  const [language, setLanguage] = useState("en");

  // --- Page state ---
  const [players, setPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing players once when the page first renders.
  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }
    setPlayers((data as Player[]) ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("players").insert({
      name,
      age: Number(age),
      position,
      currentFocus,
      goal,
      language,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setName("");
    setAge("");
    setPosition("striker");
    setCurrentFocus("");
    setGoal("");
    setLanguage("en");
    loadPlayers();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {/* Back to landing */}
      <Link href="/" className="text-sm text-emerald-600 hover:underline">
        ← Home
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Player profile
      </h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Create a player profile to get started.
      </p>

      {/* --- Create player form --- */}
      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"
      >
        <Field label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Sam Rivera"
          />
        </Field>

        <Field label="Age">
          <input
            className={inputClass}
            type="number"
            min={10}
            max={18}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            placeholder="10–18"
          />
        </Field>

        <Field label="Position">
          <select
            className={inputClass}
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Current focus">
          <input
            className={inputClass}
            value={currentFocus}
            onChange={(e) => setCurrentFocus(e.target.value)}
            placeholder="e.g. weak-foot control"
          />
        </Field>

        <Field label="Goal">
          <input
            className={inputClass}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. make the school first team"
          />
        </Field>

        <Field label="Language">
          <input
            className={inputClass}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="en"
          />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create player"}
        </button>

        {error && <p className="text-sm text-red-600">Error: {error}</p>}
      </form>

      {/* --- List of existing players --- */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Players ({players.length})
        </h2>

        {players.length === 0 ? (
          <p className="mt-2 text-zinc-500">No players yet. Create one above.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {players.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {p.name}{" "}
                  <span className="text-zinc-500">
                    · {p.position} · age {p.age}
                  </span>
                </div>
                {p.currentFocus && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Focus: {p.currentFocus}
                  </div>
                )}
                {p.goal && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Goal: {p.goal}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// --- Small reusable bits (kept in this file to stay simple) ---

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 " +
  "outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}
