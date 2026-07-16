"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

/* ─── Easing ─────────────────────────────────────────────────────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.14, ease: EASE },
  }),
};

/* ─── Icons ──────────────────────────────────────────────────────── */
function IconMessage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* ─── Card Data ──────────────────────────────────────────────────── */
const CARDS = [
  {
    num: "01",
    icon: <IconMessage />,
    title: "Describe Your Problem",
    desc: "Tell AthletIQ about your match, training session, or challenge. The AI analyzes weaknesses in shooting, passing, stamina, positioning, ball control, and decision making.",
    link: "Get Started",
  },
  {
    num: "02",
    icon: <IconActivity />,
    title: "Stats & Performance Tracking",
    desc: "Track your progress after every training session. Visualize match analytics, heat maps, sprint speed, passing accuracy, stamina trends, and AI-generated performance insights.",
    link: "See Your Stats",
  },
  {
    num: "03",
    icon: <IconUsers />,
    title: "Live Coach Interaction",
    desc: "Connect with certified football coaches through live sessions, receive personalized feedback, weekly training plans, and tactical guidance to accelerate your improvement.",
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
      whileHover={{
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      className="group relative flex flex-col flex-1 min-w-0 rounded-[20px] p-8"
      style={{
        background: "rgba(15,15,15,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        minHeight: "340px",
        transition: "border-color 300ms ease, box-shadow 300ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(20,184,166,0.35)";
        el.style.boxShadow = "0 0 40px rgba(20,184,166,0.08), 0 20px 48px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(255,255,255,0.08)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Number */}
      <p className="text-xs font-semibold tracking-widest mb-5"
        style={{ color: "rgba(255,255,255,0.2)" }}>
        {card.num}
      </p>

      {/* Icon box */}
      <motion.div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-7 flex-shrink-0"
        style={{
          background: "rgba(20,184,166,0.08)",
          border: "1px solid rgba(20,184,166,0.18)",
        }}
        whileHover={{ scale: 1.12 }}
        transition={{ duration: 0.2 }}
      >
        {card.icon}
      </motion.div>

      {/* Title */}
      <h3 className="text-white font-bold text-lg leading-snug tracking-tight mb-4">
        {card.title}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed flex-1"
        style={{ color: "#A1A1AA" }}>
        {card.desc}
      </p>

      {/* Link */}
      <a
        href="#"
        className="inline-flex items-center gap-1.5 mt-7 text-sm font-semibold transition-colors duration-200 hover:opacity-80"
        style={{ color: "#14B8A6" }}
      >
        {card.link}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </a>
    </motion.div>
  );
}

/* ─── Section ────────────────────────────────────────────────────── */
export default function FeaturesSection() {
  return (
    <section
      className="relative w-full"
      style={{
        background: "#050505",
        paddingTop: "140px",
        paddingBottom: "140px",
      }}
      aria-labelledby="features-heading"
    >
      {/* Ambient teal glow */}
      <div
        className="absolute pointer-events-none"
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
        className="absolute pointer-events-none"
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

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

        {/* ── Header ── */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <h2
            id="features-heading"
            className="font-extrabold text-white mx-auto"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: "700px",
            }}
          >
            Everything You Need To Improve
          </h2>
        </motion.div>

        {/* ── Cards ── */}
        <div className="flex flex-col md:flex-row gap-5">
          {CARDS.map((card, i) => (
            <FeatureCard key={card.num} card={card} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
