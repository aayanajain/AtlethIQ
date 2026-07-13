"use client";
// app/(protected)/player/plan/page.tsx
//
// Plan — pick what you're planning for (the HORIZON) and generate a fresh AI
// development plan. Plans are NOT stored: every generate builds a new one on a
// dedicated result page.
//
// The horizon picker is an EXPANDABLE ANIMATED CARD SLIDER (adapted from a
// CSS/JS "trending cards" reference into our Next.js + Tailwind + framer-motion
// stack): a row of image-backed cards where the selected one grows wide and
// reveals its description. Pressing "Generate plan" opens a session-styled modal
// that collects any context the horizon needs plus an optional "tailor it to
// something specific" note, then routes to the fresh plan.

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { PlanHorizon } from "@/src/types";

// Our signature easing (see design-system memory) — used across the reveal.
const EASE = [0.22, 1, 0.36, 1] as const;

// Shared dark input styling (matches the session log modal).
const INPUT_DARK =
  "w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white " +
  "placeholder-white/30 outline-none transition focus:border-green-500/60";

// The four horizons, dressed as slider cards. Each reuses an existing /public
// image and carries the copy that shows when the card expands.
const HORIZONS: {
  id: PlanHorizon;
  label: string;
  tag: string;
  blurb: string;
  image: string;
}[] = [
  {
    id: "next-session",
    label: "Next session",
    tag: "One focus",
    blurb:
      "A plan for your very next session — one clear priority and the drills to nail it.",
    image: "/next.png",
  },
  {
    id: "week",
    label: "This week",
    tag: "7 days",
    blurb:
      "Your week mapped out day by day — balancing sharpening, recovery and your current focus.",
    image: "/week.png",
  },
  {
    id: "match",
    label: "Match prep",
    tag: "Game ready",
    blurb:
      "Prep tuned to your opponent and venue — what to rehearse so you turn up ready.",
    image: "/match.png",
  },
  {
    id: "tournament",
    label: "Tournament",
    tag: "Multi-game",
    blurb:
      "Peak across several games — manage your load, stay sharp, and finish strong.",
    image: "/tornament.png",
  },
];

export default function PlanPage() {
  const router = useRouter();
  const [horizon, setHorizon] = useState<PlanHorizon>("week");
  const [opponent, setOpponent] = useState("even"); // weak | even | strong
  const [homeAway, setHomeAway] = useState("home"); // home | away
  const [games, setGames] = useState("3");
  const [message, setMessage] = useState(""); // optional "tailor it to…" note
  const [showModal, setShowModal] = useState(false);

  const activeHorizon = HORIZONS.find((h) => h.id === horizon) ?? HORIZONS[0];

  // Build the result URL from the current selection and go there — the result
  // page does the actual generation on load (a fresh plan every time).
  function generate() {
    const q = new URLSearchParams({ horizon });
    if (horizon === "match") {
      q.set("opponent", opponent);
      q.set("homeAway", homeAway);
    }
    if (horizon === "tournament") q.set("games", games);
    const note = message.trim();
    if (note) q.set("message", note);
    router.push(`/player/plan/result?${q.toString()}`);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      {/* ── Single heading + subheading ── */}
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Your plan</h1>
      <p className="mt-2 max-w-xl text-sm text-white/60">
        Pick what you&apos;re planning for — the AI tailors it to your training history.
      </p>

      {/* ── Expandable animated card slider (the horizon picker) ── */}
      <div className="mt-8 flex h-[300px] gap-4 overflow-x-auto pb-1 sm:h-[380px] sm:gap-5">
        {HORIZONS.map((h) => {
          const active = horizon === h.id;
          return (
            <motion.button
              key={h.id}
              type="button"
              onClick={() => setHorizon(h.id)}
              animate={{ flexGrow: active ? 2.6 : 1 }}
              transition={{ duration: 0.55, ease: EASE }}
              style={{ minWidth: active ? 260 : 68, flexBasis: 0 }}
              className={
                "group relative h-full shrink-0 overflow-hidden rounded-2xl border text-left transition-colors " +
                (active
                  ? "border-teal-400/40 shadow-[0_20px_50px_-12px_rgba(20,184,166,0.35)]"
                  : "border-white/10 hover:border-white/25")
              }
            >
              {/* Background image */}
              <Image
                src={h.image}
                alt={h.label}
                fill
                sizes="(max-width: 640px) 60vw, 40vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Legibility gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

              {/* Content, pinned to the bottom */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col p-4 sm:p-5">
                <h3 className="text-lg font-bold leading-tight text-white sm:text-xl">
                  {h.label}
                </h3>

                {/* Description — only on the active card */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="mt-2 max-w-sm text-sm text-white/75">{h.blurb}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Generate button (opens the input modal) ── */}
      <div className="mt-6 flex justify-start">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-8 py-3 text-sm font-semibold text-black transition hover:bg-green-400 active:scale-[0.98]"
        >
          Generate plan
        </button>
      </div>

      {/* ── Input modal (styled like the session log wizard) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e] shadow-2xl"
          >
            {/* Header */}
            <div className="shrink-0 px-6 pt-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Back"
                >
                  ←
                </button>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-400">
                    {activeHorizon.tag}
                  </div>
                  <h2 className="text-xl font-bold text-white">{activeHorizon.label}</h2>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-white/10" />

            {/* Body: the horizon's blurb + any inputs it needs + optional note */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-sm text-white/50">{activeHorizon.blurb}</p>

              {horizon === "match" && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-green-400">
                      Opponent
                    </span>
                    <select
                      value={opponent}
                      onChange={(e) => setOpponent(e.target.value)}
                      className={INPUT_DARK}
                    >
                      <option value="weak">Weaker</option>
                      <option value="even">Even</option>
                      <option value="strong">Stronger</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-green-400">
                      Venue
                    </span>
                    <select
                      value={homeAway}
                      onChange={(e) => setHomeAway(e.target.value)}
                      className={INPUT_DARK}
                    >
                      <option value="home">Home</option>
                      <option value="away">Away</option>
                    </select>
                  </label>
                </div>
              )}

              {horizon === "tournament" && (
                <label className="mt-5 block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-green-400">
                    Number of games
                  </span>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={games}
                    onChange={(e) => setGames(e.target.value)}
                    className={INPUT_DARK + " w-32"}
                  />
                </label>
              )}

              {/* Optional tailoring note */}
              <label className="mt-5 block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-green-400">
                  Anything specific?{" "}
                  <span className="font-medium normal-case tracking-normal text-white/40">
                    (optional)
                  </span>
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="e.g. I keep getting nutmegged, or I want to work on my weak foot"
                  className={INPUT_DARK + " resize-none"}
                />
              </label>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm font-medium text-white/50 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={generate}
                className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400"
              >
                Generate plan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
