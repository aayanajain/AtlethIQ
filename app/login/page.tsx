"use client";
// app/login/page.tsx
//
// PUBLIC login page. Keeps the Player / Coach toggle:
//   - Player: REAL login (email + password checked by Supabase). On success we
//     go to the player dashboard.
//   - Coach: still a demo doorway (no accounts yet) — it just opens the coach
//     placeholder. Real coach auth comes later.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";

type Role = "player" | "coach";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("player");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlayerLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    // Real auth: Supabase checks the email + password against the database.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }

    // Logged in — the session cookie is set, so the /player gate will let us in.
    router.push("/player");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <Link href="/" className="text-sm text-emerald-600 hover:underline">
        ← Home
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Log in
      </h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Choose how you want to log in.
      </p>

      {/* --- Player / Coach toggle --- */}
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
        <ToggleButton active={role === "player"} onClick={() => setRole("player")}>
          ⚽ Player
        </ToggleButton>
        <ToggleButton active={role === "coach"} onClick={() => setRole("coach")}>
          📋 Coach
        </ToggleButton>
      </div>

      {role === "player" ? (
        // --- Real player login ---
        <form onSubmit={handlePlayerLogin} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Logging in…" : "Log in"}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <p className="text-center text-sm text-zinc-500">
            New here?{" "}
            <Link href="/signup" className="font-medium text-emerald-600 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      ) : (
        // --- Coach demo doorway (no real auth yet) ---
        <div className="mt-6">
          <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Coach accounts are coming soon. For now you can preview the coach
            dashboard.
          </p>
          <button
            onClick={() => router.push("/coach")}
            className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Preview coach dashboard →
          </button>
        </div>
      )}
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 " +
  "outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function ToggleButton({
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
        "rounded-full py-2 text-sm font-medium transition " +
        (active
          ? "bg-white text-zinc-900 shadow dark:bg-zinc-950 dark:text-zinc-50"
          : "text-zinc-500")
      }
    >
      {children}
    </button>
  );
}
