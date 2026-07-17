"use client";

// Reviews / testimonials — sits between the CTA band and the footer.
// NOTE: these are illustrative sample quotes for a pre-launch product; swap them
// for real, attributed testimonials before going live.

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Cards grow in with a subtle scale rather than sliding up.
const card: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, delay: i * 0.07, ease: EASE },
  }),
};

type Review = { quote: string; name: string; role: string; initials: string };

const REVIEWS: Review[] = [
  {
    quote:
      "I just type what happened after training and it tells me exactly what to work on. My weak foot has actually got better.",
    name: "Leo M.",
    role: "U14 winger",
    initials: "LM",
  },
  {
    quote:
      "Finally a way to keep an eye on all 22 kids without spending my whole evening buried in spreadsheets.",
    name: "Coach Diallo",
    role: "Grassroots coach",
    initials: "CD",
  },
  {
    quote:
      "It noticed I was plateauing before I did and switched up my drills. Felt like having a personal coach in my pocket.",
    name: "Sara P.",
    role: "U16 midfielder",
    initials: "SP",
  },
  {
    quote:
      "The feedback actually judges my keeper on the right things, shot-stopping and distribution, not just goals.",
    name: "Amir K.",
    role: "U15 goalkeeper",
    initials: "AK",
  },
  {
    quote:
      "I set a focus for a player and it flagged when their sessions didn’t match up. Saved me a difficult conversation.",
    name: "Coach Nadia",
    role: "Youth academy coach",
    initials: "CN",
  },
  {
    quote:
      "There’s no academy near us, but this gives my son proper, personalised guidance for the first time.",
    name: "Priya R.",
    role: "Parent",
    initials: "PR",
  },
];

function Stars() {
  return (
    <div className="mb-4 flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-4 w-4" fill="#f4d35e" aria-hidden="true">
          <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8-4.3-4.1 5.9-.9L12 3Z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ r, index }: { r: Review; index: number }) {
  return (
    <motion.figure
      custom={index}
      variants={card}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-[20px] p-7 transition-[border-color] duration-300 hover:border-teal-500/25"
      style={{
        background: "rgba(15,15,15,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* subtle gradient wash on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(20,184,166,0.14) 0%, rgba(20,184,166,0.03) 45%, transparent 75%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col">
        <Stars />
        <blockquote className="flex-1 text-sm leading-relaxed text-white/85">“{r.quote}”</blockquote>
        <figcaption className="mt-6 flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-teal-300"
            style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.28)" }}
          >
            {r.initials}
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">{r.name}</span>
            <span className="block text-xs text-[#A1A1AA]">{r.role}</span>
          </span>
        </figcaption>
      </div>
    </motion.figure>
  );
}

export default function ReviewsSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#050505", paddingTop: "120px", paddingBottom: "120px" }}
      aria-labelledby="reviews-heading"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2"
        style={{
          width: "50vw",
          height: "320px",
          background: "radial-gradient(ellipse, rgba(20,184,166,0.05) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-14 text-center"
        >
          <h2
            id="reviews-heading"
            className="mx-auto font-extrabold text-white"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.12, letterSpacing: "-0.02em" }}
          >
            Loved by <span className="text-teal-400">everyone</span>
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <ReviewCard key={r.name} r={r} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
