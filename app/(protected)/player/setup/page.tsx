"use client";
// app/(protected)/player/setup/page.tsx
//
// The logged-in player's OWN football profile. With real auth, a user has ONE
// player profile. So this page:
//   - loads the current user's player (if it exists) and pre-fills the form,
//   - creates it the first time, or updates it after that.
// Row Level Security guarantees you only ever see/edit your own profile, and the
// "ownerId" column defaults to your user id automatically.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import type { Player, Position } from "@/src/types";
import { ROLES } from "@/src/lib/positions";

export default function PlayerSetupPage() {
  const router = useRouter();

  const [existingId, setExistingId] = useState<string | null>(null); // set if editing
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [position, setPosition] = useState<Position>("striker");
  const [currentFocus, setCurrentFocus] = useState("");
  const [goal, setGoal] = useState("");
  const [language, setLanguage] = useState("en");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load my profile (if I already made one). RLS returns only my own row.
  useEffect(() => {
    async function loadMine() {
      const { data } = await supabase.from("players").select("*").limit(1).maybeSingle();
      if (data) {
        const p = data as Player;
        setExistingId(p.id);
        setName(p.name);
        setAge(String(p.age));
        setPosition(p.position);
        setCurrentFocus(p.currentFocus);
        setGoal(p.goal);
        setLanguage(p.language);
      }
      setLoading(false);
    }
    loadMine();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fields = {
      name,
      age: Number(age),
      position,
      currentFocus,
      goal,
      language,
    };

    // Update if I already have a profile, otherwise insert a new one.
    const { error } = existingId
      ? await supabase.from("players").update(fields).eq("id", existingId)
      : await supabase.from("players").insert(fields);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/player");
  }

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading…</div>;
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <Link href="/player" className="text-sm text-emerald-600 hover:underline">
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {existingId ? "Edit your profile" : "Set up your profile"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Sam Rivera" />
        </Field>
        <Field label="Age">
          <input className={inputClass} type="number" min={10} max={18} value={age} onChange={(e) => setAge(e.target.value)} required placeholder="10–18" />
        </Field>
        <Field label="Position">
          <select className={inputClass} value={position} onChange={(e) => setPosition(e.target.value as Position)}>
            {ROLES.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Current focus">
          <input className={inputClass} value={currentFocus} onChange={(e) => setCurrentFocus(e.target.value)} placeholder="e.g. weak-foot control" />
        </Field>
        <Field label="Goal">
          <input className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. make the school first team" />
        </Field>
        <Field label="Language">
          <input className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" />
        </Field>

        <button type="submit" disabled={saving} className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          {saving ? "Saving…" : existingId ? "Save changes" : "Create profile"}
        </button>

        {error && <p className="text-sm text-red-600">Error: {error}</p>}
      </form>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 " +
  "outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}
