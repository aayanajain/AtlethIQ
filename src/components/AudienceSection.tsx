"use client";

// The two-sided loop: what a young player gets, and what their coach gets —
// the same session data, seen from both ends, with the AI reconciling them.

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// The two panels slide in from opposite sides, meeting in the middle.
const panel: Variants = {
  hidden: (i: number) => ({ opacity: 0, x: i === 0 ? -56 : 56 }),
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, delay: i * 0.1, ease: EASE },
  }),
};

const CheckMark = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const PLAYER = {
  eyebrow: "For players",
  accent: "#14b8a6",
  title: "Your personal AI sports scientist",
  desc: "Everything a big academy gives its prospects, tailored to you, in your pocket.",
  points: [
    "Conversational logging, no spreadsheets, just talk",
    "Position-aware drills tuned to your goals & schedule",
    "Development curves that show you improving over weeks",
    "A mentor you can ask anything, any time",
    "Encouraging fuelling tips from a photo of your plate",
  ],
  cta: { label: "Start training free", href: "/signup" },
};

const COACH = {
  eyebrow: "For coaches",
  accent: "#22c55e",
  title: "Every player tracked, without the workload",
  desc: "See a whole squad at a glance and know exactly who needs you this week.",
  points: [
    "Squad overview with per-player development at a glance",
    "Set a focus directive for any player in seconds",
    "An attention list that surfaces who’s stalling or fatigued",
    "Mismatch flags when the plan and the sessions disagree",
    "Individual tracking for large squads, no per-player admin",
  ],
  cta: { label: "Explore the coach view", href: "/login?role=coach" },
};

function Panel({ data, index }: { data: typeof PLAYER; index: number }) {
  return (
    <motion.div
      custom={index}
      variants={panel}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="relative flex flex-col overflow-hidden rounded-[24px] p-8 lg:p-10"
      style={{
        background: "rgba(15,15,15,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* corner glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56"
        style={{ background: `radial-gradient(circle, ${data.accent}22 0%, transparent 70%)`, filter: "blur(24px)" }}
      />

      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: data.accent }}>
        {data.eyebrow}
      </p>
      <h3 className="mb-3 text-2xl font-bold leading-tight tracking-tight text-white">
        {data.title}
      </h3>
      <p className="mb-8 text-sm leading-relaxed text-[#A1A1AA]">{data.desc}</p>

      <ul className="mb-9 space-y-3.5">
        {data.points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm text-white/80">
            <CheckMark color={data.accent} />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <a
        href={data.cta.href}
        className="group mt-auto inline-flex w-fit items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ color: data.accent }}
      >
        {data.cta.label}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </a>
    </motion.div>
  );
}

export default function AudienceSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#050505", paddingBottom: "140px" }}
      aria-labelledby="audience-heading"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2
            id="audience-heading"
            className="font-extrabold text-white"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.12, letterSpacing: "-0.02em" }}
          >
            One <span className="text-[#22c55e]">loop</span> between player and coach
          </h2>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel data={PLAYER} index={0} />
          <Panel data={COACH} index={1} />
        </div>
      </div>
    </section>
  );
}
