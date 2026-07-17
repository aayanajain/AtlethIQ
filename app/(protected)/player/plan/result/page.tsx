"use client";
// app/(protected)/player/plan/result/page.tsx
//
// The generated plan, on its own fresh page. It reads the horizon (+ any
// context and the optional tailoring message) from the URL, generates the plan
// on load, and renders it. Plans are NOT saved — every visit builds a fresh one.

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import type { Plan, PlanHorizon, TrendDirection } from "@/src/types";

const HORIZON_LABEL: Record<PlanHorizon, string> = {
  "next-session": "Next session",
  week: "This week",
  match: "Match prep",
  tournament: "Tournament",
};

/* ─── Inline lucide-style icons (teal, matching the home page) ─────────── */

const svgProps = {
  fill: "none",
  stroke: "currentColor" as const,
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

const TargetIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </svg>
);

const TrendsIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const DrillIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const CalendarIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

// A section heading: a small teal icon + the uppercase label.
function Head({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-teal-400">{icon}</span>
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
        {children}
      </h2>
    </div>
  );
}

export default function PlanResultPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PlanResult />
    </Suspense>
  );
}

function PlanResult() {
  const params = useSearchParams();
  const horizon = (params.get("horizon") as PlanHorizon) || "week";

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Save to journey" state: idle → saving → saved (plans are ephemeral until
  // the player explicitly keeps one).
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const contextRef = useRef<Record<string, unknown>>({});

  // Generate exactly once on mount, from the URL params.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const context: Record<string, unknown> = {};
    if (horizon === "match") {
      context.opponent = params.get("opponent") ?? "even";
      context.homeAway = params.get("homeAway") ?? "home";
    }
    if (horizon === "tournament") {
      context.games = Number(params.get("games")) || params.get("games") || "3";
    }
    const message = params.get("message");
    if (message) context.message = message;
    contextRef.current = context; // remembered for "Save to journey"

    (async () => {
      try {
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ horizon, context }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          return;
        }
        setPlan(data.plan as Plan);
      } catch {
        setError("Could not reach the server.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const message = params.get("message");

  // Keep this plan: append a row to the plans history (the Journey reads these).
  async function saveToJourney() {
    if (!plan || saveState !== "idle") return;
    setSaveState("saving");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const playerId = user?.id;
    if (!playerId) {
      setError("Couldn't find your profile to save the plan.");
      setSaveState("idle");
      return;
    }
    const { error: saveErr } = await supabase.from("plans").insert({
      playerId,
      horizon,
      plan,
      context: contextRef.current,
    });
    if (saveErr) {
      setError(saveErr.message);
      setSaveState("idle");
      return;
    }
    setSaveState("saved");
  }

  if (loading) return <Loading horizon={horizon} />;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/player/plan"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Back to plans"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Your plan</h1>

        {/* Save to journey */}
        {plan && (
          <div className="ml-auto">
            {saveState === "saved" ? (
              <Link
                href="/player/journey"
                className="text-sm font-medium text-teal-300 transition hover:text-teal-200"
              >
                Saved ✓ · View journey →
              </Link>
            ) : (
              <button
                onClick={saveToJourney}
                disabled={saveState === "saving"}
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-50"
              >
                {saveState === "saving" ? "Saving…" : "Save to journey"}
              </button>
            )}
          </div>
        )}
      </div>

      {message && (
        <p className="mt-3 text-sm text-white/50">
          Tailored to: <span className="italic text-white/70">“{message}”</span>
        </p>
      )}

      {error && (
        <div className="mt-8">
          <p className="text-sm text-red-300">{error}</p>
          <Link href="/player/plan" className="mt-2 inline-block text-sm font-medium text-teal-300 hover:underline">
            ← Back to plans
          </Link>
        </div>
      )}

      {plan && (
        <div className="mt-8">
          {plan.summary && (
            <p className="max-w-2xl text-base leading-relaxed text-white/70">{plan.summary}</p>
          )}

          {/* Watch-out flag — a gentle line, not a boxed alert */}
          {plan.mismatchFlag?.present && (
            <p className="mt-4 text-sm text-amber-300/90">⚠️ {plan.mismatchFlag.message}</p>
          )}

          {/* 2×2 relaxed layout: Next focus · Trends / Drill plan · Schedule */}
          <div className="mt-10 grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {/* Next focus */}
            {plan.nextFocus.skill && (
              <section>
                <Head icon={<TargetIcon />}>Next focus</Head>
                <p className="mt-4 text-xl font-semibold text-teal-300">{plan.nextFocus.skill}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {plan.nextFocus.reasoning}
                </p>
              </section>
            )}

            {/* Trends */}
            <section>
              <Head icon={<TrendsIcon />}>Trends</Head>
              {plan.trends.length === 0 ? (
                <p className="mt-4 text-sm text-white/50">Not enough data yet — log more sessions.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {plan.trends.map((t, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-white/80">{t.skill}</span>
                      <TrendArrow direction={t.direction} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Drill plan */}
            {plan.drillPlan.length > 0 && (
              <section>
                <Head icon={<DrillIcon />}>Drill plan</Head>
                <ul className="mt-4 space-y-5">
                  {plan.drillPlan.map((d, i) => (
                    <li key={i}>
                      <div className="font-medium text-white">{d.drill}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-green-400">
                        <TargetIcon className="h-3.5 w-3.5" />
                        <span>{d.target}</span>
                      </div>
                      <div className="mt-1 text-sm leading-relaxed text-white/50">{d.why}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Schedule (week / tournament) */}
            {plan.schedule && plan.schedule.length > 0 && (
              <section>
                <Head icon={<CalendarIcon />}>Schedule</Head>
                <div className="mt-4 space-y-3">
                  {plan.schedule.map((s, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="w-20 shrink-0 text-sm font-semibold text-teal-300">{s.label}</span>
                      <span className="text-sm leading-relaxed text-white/60">{s.focus}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Loading({ horizon }: { horizon?: PlanHorizon }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-teal-400" />
      <p className="mt-5 text-sm font-medium text-white/70">
        Building your {horizon ? HORIZON_LABEL[horizon].toLowerCase() : ""} plan…
      </p>
      <p className="mt-1 text-xs text-white/40">Reading your training history</p>
    </div>
  );
}

function TrendArrow({ direction }: { direction: TrendDirection }) {
  // "down" is amber, not red — encouraging, never punishing.
  const map: Record<TrendDirection, { path: ReactNode; cls: string; label: string }> = {
    up: {
      path: <path d="M12 19V5M5 12l7-7 7 7" />,
      cls: "text-green-400",
      label: "up",
    },
    flat: {
      path: <path d="M5 12h14" />,
      cls: "text-white/40",
      label: "flat",
    },
    down: {
      path: <path d="M12 5v14M5 12l7 7 7-7" />,
      cls: "text-amber-400",
      label: "down",
    },
  };
  const { path, cls, label } = map[direction];
  return (
    <span className={"flex items-center gap-1 text-xs font-semibold " + cls}>
      <svg {...svgProps} strokeWidth={2} className="h-3.5 w-3.5">
        {path}
      </svg>
      {label}
    </span>
  );
}
