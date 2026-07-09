"use client";
// app/login/page.tsx
//
// Login — a PUBLIC page at "/login". This is the doorway into the app.
// It has the Player / Coach toggle you asked for: the user picks which side
// they're logging into, and we send them to that world.
//
// SKELETON for now: it does NOT check a real password yet. The "Continue"
// button just routes to the right home based on the selected role. When we
// decide on auth (real Supabase Auth vs a demo toggle), the real check goes
// in handleContinue() below.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// The two roles a user can log in as.
type Role = "player" | "coach";

export default function LoginPage() {
  const router = useRouter(); // lets us send the user to another page in code
  const [role, setRole] = useState<Role>("player");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();

    // TODO (when we wire auth): actually verify the user here with Supabase
    // before letting them in. For now we just route based on the chosen role
    // so we can build and click through the protected pages.
    if (role === "player") {
      router.push("/player");
    } else {
      router.push("/coach");
    }
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
        <ToggleButton
          active={role === "player"}
          onClick={() => setRole("player")}
        >
          ⚽ Player
        </ToggleButton>
        <ToggleButton
          active={role === "coach"}
          onClick={() => setRole("coach")}
        >
          📋 Coach
        </ToggleButton>
      </div>

      {/* --- Login form (skeleton fields) --- */}
      <form onSubmit={handleContinue} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            placeholder="••••••••"
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700"
        >
          Continue as {role === "player" ? "Player" : "Coach"}
        </button>
      </form>

      {/* Note to ourselves while it's a skeleton. */}
      <p className="mt-4 text-center text-xs text-zinc-400">
        (demo login — no password check yet)
      </p>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 " +
  "outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

// One half of the role toggle. Highlights when it's the active choice.
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
