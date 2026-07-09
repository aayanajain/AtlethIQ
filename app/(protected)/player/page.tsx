// app/(protected)/player/page.tsx
//
// Player dashboard — a post-login page (inside the (protected) area).
// PLACEHOLDER for now: it just lays out a player-flavoured dashboard and says
// "under development". We'll design the real personalized experience (session
// logging, plan, progress) here later, once real auth is in place.

import Link from "next/link";

export default function PlayerDashboardPage() {
  return (
    <main className="mx-auto max-w-md px-5 py-6">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-600">Player</span>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          Log out
        </Link>
      </header>

      {/* Greeting */}
      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Your dashboard
      </h1>

      {/* Under-development banner */}
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        🚧 Under development — your personalized experience is coming here.
      </div>

      {/* Placeholder cards that hint at what will live here */}
      <div className="mt-6 space-y-3">
        <PlaceholderCard title="Log today's session" hint="Tell your coach how training went" />
        <PlaceholderCard title="This week's focus" hint="Your current development target" />
        <PlaceholderCard title="Your progress" hint="Trends across your football skills" />
      </div>

      {/* The one working feature so far. */}
      <div className="mt-6 text-center">
        <Link href="/player/setup" className="text-sm font-medium text-emerald-600 hover:underline">
          Set up / edit player profile →
        </Link>
      </div>
    </main>
  );
}

// A greyed-out card standing in for a future feature.
function PlaceholderCard({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 opacity-70 dark:border-zinc-800">
      <div className="font-medium text-zinc-900 dark:text-zinc-50">{title}</div>
      <div className="text-sm text-zinc-500">{hint}</div>
    </div>
  );
}
