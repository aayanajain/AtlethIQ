// app/page.tsx
//
// Home — the PUBLIC marketing landing page at "/". No login required.
// This is the first thing a visitor sees. Its job: explain what AthletIQ is
// and push people toward Login. Mobile-first (designed for a phone, scales up).
//
// Plain server component (no "use client") — it's just content and links.

import Link from "next/link";
import PublicHeader from "@/src/components/PublicHeader";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero section */}
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Your AI football
          <br />
          development coach
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Log your training in plain language. AthletIQ turns it into a
          personalized, position-aware plan that adapts week over week — and
          keeps your coach in the loop.
        </p>

        {/* Primary calls to action */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="w-full rounded-full bg-emerald-600 px-8 py-3 font-medium text-white hover:bg-emerald-700 sm:w-auto"
          >
            Get started
          </Link>
          <Link
            href="/about"
            className="w-full rounded-full border border-zinc-300 px-8 py-3 font-medium text-zinc-900 hover:bg-zinc-50 sm:w-auto dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Learn more
          </Link>
        </div>

        {/* Three simple value props */}
        <div className="mt-20 grid gap-6 text-left sm:grid-cols-3">
          <Feature
            emoji="📝"
            title="Just describe it"
            body="Type how training went in your own words. No forms, no jargon."
          />
          <Feature
            emoji="📈"
            title="See your progress"
            body="Track passing, finishing, dribbling, stamina and your weak foot over time."
          />
          <Feature
            emoji="🤝"
            title="Coach in the loop"
            body="Your coach sets focus areas and the AI flags when something's off."
          />
        </div>
      </main>
    </div>
  );
}

// A small value-prop card used in the hero grid.
function Feature({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  );
}
