"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

/* ─── Easing ─────────────────────────────────────────────────────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const sectionVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: EASE },
  },
};

// Cards fan in from different directions: left, up, right.
const cardVariants: Variants = {
  hidden: (i: number) => ({
    opacity: 0,
    x: i === 0 ? -56 : i === 2 ? 56 : 0,
    y: i === 1 ? 48 : 0,
  }),
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: EASE },
  }),
};

/* ─── Card Data ──────────────────────────────────────────────────── */
// Image paths are URL-encoded because the files have spaces in their names.
const CARDS = [
  {
    num: "01",
    image: "/home%205.jpg",
    title: "Describe Your Session",
    desc: "Tell AthletIQ about your match or training in plain words. The AI reads your game and pinpoints where to improve, finishing, passing, stamina, control.",
    link: "Get Started",
  },
  {
    num: "02",
    image: "/home%204.jpg",
    title: "Stats & Performance Tracking",
    desc: "Watch your progress after every session, development curves, position-aware metrics, and AI-generated insights that show exactly how you’re growing.",
    link: "See Your Stats",
  },
  {
    num: "03",
    image: "/home%203.png",
    title: "Live Coach Interaction",
    desc: "Your coach sets a focus and sees every player at a glance. The AI reconciles their guidance with your real sessions, so you both stay on the same page.",
    link: "Find a Coach",
  },
];

/* ─── Card ───────────────────────────────────────────────────────── */
function FeatureCard({
  card,
  index,
}: {
  card: (typeof CARDS)[number];
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
      className="group relative flex min-h-[440px] flex-1 flex-col justify-end overflow-hidden rounded-[20px] border border-white/[0.08] transition-[border-color,box-shadow] duration-300 hover:border-teal-500/35 hover:shadow-[0_0_44px_rgba(20,184,166,0.12),0_24px_48px_rgba(0,0,0,0.5)]"
    >
      {/* Background image */}
      <Image
        src={card.image}
        alt={card.title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.06]"
      />

      {/* Gradient scrim for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(5,5,5,0.96) 0%, rgba(5,5,5,0.82) 30%, rgba(5,5,5,0.28) 62%, rgba(5,5,5,0.08) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-7">
        <h3 className="mb-3 text-xl font-bold leading-snug tracking-tight text-white">
          {card.title}
        </h3>
        <p className="text-sm leading-relaxed text-white/70">{card.desc}</p>

        <a
          href="#"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-400 transition-colors duration-200 hover:text-teal-300"
        >
          {card.link}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </a>
      </div>
    </motion.div>
  );
}

/* ─── Section ────────────────────────────────────────────────────── */
export default function FeaturesSection() {
  return (
    <section
      className="relative w-full"
      style={{ background: "#050505", paddingTop: "140px", paddingBottom: "96px" }}
      aria-labelledby="features-heading"
    >
      {/* Ambient teal glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60vw",
          height: "1px",
          background: "linear-gradient(to right, transparent, rgba(20,184,166,0.18), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          top: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "40vw",
          height: "300px",
          background: "radial-gradient(ellipse, rgba(20,184,166,0.05) 0%, transparent 70%)",
          filter: "blur(32px)",
        }}
      />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        {/* ── Header ── */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-16 text-center"
        >
          <h2
            id="features-heading"
            className="mx-auto whitespace-nowrap font-extrabold text-white"
            style={{ fontSize: "clamp(1.35rem, 4.4vw, 3.5rem)", lineHeight: 1.15, letterSpacing: "-0.02em" }}
          >
            Everything You Need To <span className="text-[#22c55e]">Improve</span>
          </h2>
        </motion.div>

        {/* ── Cards ── */}
        <div className="flex flex-col gap-5 md:flex-row">
          {CARDS.map((card, i) => (
            <FeatureCard key={card.num} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
