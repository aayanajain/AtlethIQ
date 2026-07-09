// app/about/page.tsx
//
// About Us — a PUBLIC page at "/about". No login required.
// Explains the mission behind AthletIQ. Content is drawn from the project
// vision in CLAUDE.md (affordable "AI sports scientist + mentor" for young
// athletes in under-resourced areas).

import Link from "next/link";
import PublicHeader from "@/src/components/PublicHeader";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          About AthletIQ
        </h1>

        <div className="mt-6 space-y-4 text-zinc-600 dark:text-zinc-400">
          <p>
            Elite football academies give their players data, personalized
            plans, and expert guidance. Most young players — especially in
            under-resourced areas — never get near those tools.
          </p>
          <p>
            AthletIQ is an affordable AI sports scientist and mentor for
            footballers aged 10–18. Players log their sessions in plain
            language, and the AI turns that into a personalized, position-aware
            development plan that adapts every week.
          </p>
          <p>
            It&apos;s two-sided: coaches — who often manage huge squads with no
            way to track each player individually — can set focus areas, while
            the AI watches for mismatches like fatigue or a plateau and flags
            them early.
          </p>
          <p>
            Our guiding principle is encouragement. AthletIQ advises; the human
            coach decides. Feedback is always framed as &ldquo;try this,&rdquo;
            never &ldquo;you&apos;re behind&rdquo; — because development isn&apos;t
            a race.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/login"
            className="inline-block rounded-full bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700"
          >
            Get started
          </Link>
        </div>
      </main>
    </div>
  );
}
