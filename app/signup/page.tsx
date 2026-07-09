"use client";
// app/signup/page.tsx
//
// PUBLIC signup page for new PLAYER accounts. Creates a real Supabase auth user
// (email + password), then a matching `profiles` row (role = player), then
// sends them to fill in their football profile.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    // 1. Create the auth user. We stash name + role in the user's metadata too.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: "player" } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    // With email confirmation OFF, signUp logs the user straight in (we get a
    // session). If there's no session, confirmation is still ON in Supabase.
    if (!data.session) {
      setError(
        "Account created, but email confirmation is on. Turn it off in Supabase (Auth → Providers → Email) for the demo, or confirm via email."
      );
      setBusy(false);
      return;
    }

    // 2. Create the profile row (role = player).
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user!.id, role: "player", name });

    if (profileError) {
      setError(profileError.message);
      setBusy(false);
      return;
    }

    // 3. Off to set up their football profile.
    router.push("/player/setup");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <Link href="/" className="text-sm text-emerald-600 hover:underline">
        ← Home
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Create your account
      </h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">Sign up as a player.</p>

      <form onSubmit={handleSignup} className="mt-6 space-y-4">
        <Field label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Sam Rivera"
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="at least 6 characters"
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Sign up"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-600 hover:underline">
          Log in
        </Link>
      </p>
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
