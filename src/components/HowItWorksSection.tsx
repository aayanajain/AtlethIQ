"use client";

// The core loop that makes AthletIQ different, laid out as a numbered vertical
// timeline: log in plain words → the AI parses it into position-aware metrics →
// it writes an adaptive plan → trends and coach-focus are reconciled weekly.
// The line draws down and each step reveals one after another on scroll.

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// The whole list plays step by step.
const list: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.35, delayChildren: 0.15 } },
};

// Each row fades up, then chains its circle → line → text.
const row: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE, when: "beforeChildren", staggerChildren: 0.1 },
  },
};

const circlePop: Variants = {
  hidden: { scale: 0.3, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 15 } },
};

const lineDraw: Variants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 0.5, ease: EASE } },
};

const text: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const STEPS = [
  {
    num: "01",
    title: "Log it in plain words",
    desc: "“Played 60 mins, legs felt heavy, but my finishing was sharp.” No forms, no stats, just say what happened.",
  },
  {
    num: "02",
    title: "The AI reads your game",
    desc: "Your note becomes position-aware metrics, finishing, passing, stamina, weak foot, judged the way a #9 or a #6 should be.",
  },
  {
    num: "03",
    title: "Get an adaptive plan",
    desc: "A personalized plan with targeted drills, tuned to your goals and availability, and rewritten as you improve.",
  },
  {
    num: "04",
    title: "Track trends & adapt",
    desc: "Week over week it spots plateaus and fatigue, and reconciles your coach’s focus with what your sessions actually show.",
  },
];

/* Line-art football, sits where the reference art does. */
function BallArt() {
  return (
    <svg viewBox="0 0 220 220" className="h-56 w-56" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="ballGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgba(20,184,166,0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx="110" cy="110" r="96" fill="url(#ballGlow)" />
      <circle cx="110" cy="110" r="88" stroke="#14b8a6" strokeWidth="1.4" opacity="0.7" />
      {/* centre pentagon */}
      <polygon points="110,74 140,96 129,131 91,131 80,96" fill="rgba(20,184,166,0.12)" stroke="#14b8a6" strokeWidth="1.4" />
      {/* spokes to the rim */}
      <g stroke="#14b8a6" strokeWidth="1.1" opacity="0.5">
        <line x1="110" y1="74" x2="110" y2="30" />
        <line x1="140" y1="96" x2="182" y2="80" />
        <line x1="129" y1="131" x2="150" y2="176" />
        <line x1="91" y1="131" x2="70" y2="176" />
        <line x1="80" y1="96" x2="38" y2="80" />
      </g>
      {/* outer arcs hinting hexagons */}
      <g stroke="#14b8a6" strokeWidth="1" opacity="0.35">
        <path d="M110 30 Q150 40 182 80" />
        <path d="M182 80 Q188 130 150 176" />
        <path d="M150 176 Q110 192 70 176" />
        <path d="M70 176 Q32 130 38 80" />
        <path d="M38 80 Q70 40 110 30" />
      </g>
    </svg>
  );
}

export default function HowItWorksSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#050505", paddingTop: "96px", paddingBottom: "140px" }}
      aria-labelledby="how-heading"
    >
      {/* Ambient teal glow */}
      <div
        className="pointer-events-none absolute left-1/3 top-24 -translate-x-1/2"
        style={{
          width: "45vw",
          height: "360px",
          background: "radial-gradient(ellipse, rgba(20,184,166,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="mx-auto grid max-w-[1400px] items-start gap-14 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12">
        {/* ── Left: heading + art ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="lg:sticky lg:top-28 lg:pl-10"
        >
          <h2
            id="how-heading"
            className="font-extrabold text-white"
            style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
          >
            Get started
            <br />
            in minutes.
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#A1A1AA]">
            One line after training is all it takes. AthletIQ turns it into a plan that keeps up with
            you.
          </p>

          {/* Bouncing, glowing football */}
          <div className="relative mt-12 hidden lg:block lg:pl-16">
            {/* pulsing glow pool */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 68%)" }}
              animate={{ opacity: [0.55, 1, 0.55], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="relative"
              style={{ filter: "drop-shadow(0 8px 24px rgba(20,184,166,0.28))" }}
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <BallArt />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Right: numbered timeline ── */}
        <motion.ol
          variants={list}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative"
        >
          {STEPS.map((s, i) => {
            const last = i === STEPS.length - 1;
            return (
              <motion.li key={s.num} variants={row} className="flex gap-6">
                {/* circle + connecting line */}
                <div className="flex flex-col items-center">
                  <motion.div
                    variants={circlePop}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-teal-500/40 bg-[#0a0d0d] text-lg font-semibold text-teal-300"
                    style={{ boxShadow: "0 0 24px rgba(20,184,166,0.12)" }}
                  >
                    {s.num}
                  </motion.div>
                  {!last && (
                    <motion.div
                      variants={lineDraw}
                      className="my-2 w-px flex-1 origin-top bg-gradient-to-b from-teal-500/50 to-teal-500/10"
                    />
                  )}
                </div>

                {/* content */}
                <motion.div variants={text} className={last ? "pb-0" : "pb-14"}>
                  <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A1A1AA]">{s.desc}</p>
                </motion.div>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}
