"use client";
// app/(protected)/player/mentor/page.tsx
//
// AI mentor — a football-themed "coming soon" placeholder. This will become the
// conversational AI coach for the player (Tier 2). Until then: a floating,
// spinning ball over a faint pitch, on our dark/teal system.

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function PlayerMentorPage() {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-8">
      {/* Ambient teal glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.18), transparent 60%)" }}
      />

      {/* Faint pitch markings */}
      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 text-white/[0.05]"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
      >
        <circle cx="100" cy="100" r="46" />
        <line x1="0" y1="100" x2="200" y2="100" />
        <circle cx="100" cy="100" r="2.2" fill="currentColor" stroke="none" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Ball + rings + shadow */}
        <div className="relative flex h-40 w-40 items-center justify-center">
          {/* Pulse rings */}
          {!reduce &&
            [0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute h-24 w-24 rounded-full border border-teal-400/40"
                initial={{ scale: 0.5, opacity: 0.5 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: i * 1 }}
              />
            ))}

          {/* Ground shadow (grows as the ball drops) */}
          <motion.div
            className="absolute bottom-1 h-3 w-20 rounded-[50%] bg-black/50 blur-md"
            animate={reduce ? {} : { scaleX: [1, 0.7, 1], opacity: [0.5, 0.28, 0.5] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* The football */}
          <motion.div
            animate={reduce ? {} : { y: [0, -16, 0], rotate: 360 }}
            transition={{
              y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 9, repeat: Infinity, ease: "linear" },
            }}
            className="drop-shadow-[0_8px_24px_rgba(20,184,166,0.25)]"
          >
            <SoccerBall />
          </motion.div>
        </div>

        {/* Copy */}
        <h1 className="-mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Coming soon
        </h1>
      </motion.div>
    </div>
  );
}

// A clean, theme-tinted soccer ball (SVG so it spins crisply).
function SoccerBall() {
  return (
    <svg width="88" height="88" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" fill="#0b0b0d" stroke="rgba(20,184,166,0.6)" strokeWidth="1.5" />

      {/* Seams from the centre pentagon out to the edge */}
      <g stroke="rgba(20,184,166,0.35)" strokeWidth="1.2" strokeLinecap="round">
        <line x1="50" y1="36" x2="50" y2="7" />
        <line x1="63.3" y1="45.7" x2="93.5" y2="35.8" />
        <line x1="58.2" y1="61.3" x2="77" y2="87.2" />
        <line x1="41.8" y1="61.3" x2="23" y2="87.2" />
        <line x1="36.7" y1="45.7" x2="6.5" y2="35.8" />
      </g>

      {/* Centre pentagon */}
      <path
        d="M50 36 L63.3 45.7 L58.2 61.3 L41.8 61.3 L36.7 45.7 Z"
        fill="rgba(20,184,166,0.9)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.8"
      />

      {/* Faint edge pentagons for depth */}
      <g fill="rgba(20,184,166,0.14)">
        <circle cx="50" cy="12" r="4" />
        <circle cx="86" cy="40" r="4" />
        <circle cx="72" cy="82" r="4" />
        <circle cx="28" cy="82" r="4" />
        <circle cx="14" cy="40" r="4" />
      </g>
    </svg>
  );
}
