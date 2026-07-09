// app/(protected)/coach/page.tsx
//
// Coach dashboard — a post-login page (inside the (protected) area).
// PLACEHOLDER for now: a coach-flavoured dashboard that says "under
// development". Deliberately WIDER and more table/overview-shaped than the
// player dashboard, since a coach scans a whole squad rather than one journey.
// We'll design the real squad view (roster, trends, mismatch flags) later.

import Link from "next/link";

export default function CoachDashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-6">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold text-indigo-600">Coach</span>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          Log out
        </Link>
      </header>

      {/* Heading */}
      <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Squad dashboard
      </h1>

      {/* Under-development banner (indigo, to differ from the player side) */}
      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
        🚧 Under development — your squad overview is coming here.
      </div>

      {/* Placeholder overview tiles (a wider, glanceable layout) */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <PlaceholderTile title="Your squad" hint="All your players in one place" />
        <PlaceholderTile title="Needs attention" hint="Fatigue, plateau & mismatch flags" />
        <PlaceholderTile title="Set focus areas" hint="Direct what each player works on" />
      </div>

      {/* Placeholder roster table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 opacity-70 dark:border-zinc-800">
        <div className="grid grid-cols-3 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          <span>Player</span>
          <span>Position</span>
          <span>Status</span>
        </div>
        <div className="px-4 py-6 text-center text-sm text-zinc-400">
          Your players will appear here.
        </div>
      </div>
    </main>
  );
}

// A wide overview tile standing in for a future coach feature.
function PlaceholderTile({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 opacity-70 dark:border-zinc-800">
      <div className="font-medium text-zinc-900 dark:text-zinc-50">{title}</div>
      <div className="mt-1 text-sm text-zinc-500">{hint}</div>
    </div>
  );
}
