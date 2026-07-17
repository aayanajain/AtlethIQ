"use client";

// "About us" / mission section — an overlapping image + card layout.
// The story: elite guidance and top coaches sit behind academy budgets, so most
// talented young players train alone, guessing what to work on. AthletIQ closes
// that access gap.

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fromLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE } },
};
const fromRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE, delay: 0.1 } },
};

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #050505 0%, #08100f 50%, #050505 100%)",
        paddingTop: "96px",
        paddingBottom: "96px",
      }}
      aria-labelledby="about-heading"
    >
      {/* Ambient teal glow */}
      <div
        className="pointer-events-none absolute -left-40 top-1/4 h-[440px] w-[440px]"
        style={{
          background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-14 text-center"
        >
          <h2
            id="about-heading"
            className="mx-auto font-extrabold text-white"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", lineHeight: 1.12, letterSpacing: "-0.02em" }}
          >
            Why we built <span className="text-teal-400">AthletIQ</span>
          </h2>
        </motion.div>

        <div className="relative lg:flex lg:items-center">
          {/* ── Image (framed) ── */}
          <motion.div
            variants={fromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="relative z-0 lg:w-[56%] lg:shrink-0"
          >
            <div className="rounded-[24px] border border-teal-500/15 bg-white/[0.02] p-2">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px]">
                <Image
                  src="/about.jpg"
                  alt="Young players competing in a match under floodlights"
                  fill
                  sizes="(max-width: 1024px) 100vw, 56vw"
                  className="object-cover -scale-x-100"
                />
              </div>
            </div>
          </motion.div>

          {/* ── Overlapping content card ── */}
          <motion.div
            variants={fromRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="relative z-10 -mt-8 lg:-ml-[10%] lg:mt-0 lg:w-[54%] lg:shrink-0"
          >
            <div
              className="rounded-[24px] p-8 sm:p-11"
              style={{
                background: "rgba(13,13,13,0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
              }}
            >
              <h3
                className="font-extrabold leading-tight tracking-tight text-white"
                style={{ fontSize: "clamp(1.9rem, 3vw, 2.75rem)" }}
              >
                Welcome to <span className="text-teal-400">AthletIQ</span>
              </h3>

              <p className="mt-5 text-lg font-bold leading-snug text-white">
                Great coaching shouldn’t depend on your postcode.
              </p>

              <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#A1A1AA]">
                <p>
                  At elite academies, every session is watched by sports scientists and full-time
                  coaches who know exactly what each player should work on next. For everyone else,
                  that guidance simply isn’t accessible.
                </p>
                <p>
                  Talented young players end up training alone, left to guess what to improve, their
                  potential unseen not because the ability isn’t there, but because the support isn’t.
                  AthletIQ puts a personal AI sports scientist and mentor in every player’s pocket.
                </p>
              </div>

              <Link
                href="/signup"
                className="group mt-8 inline-flex items-center gap-2 rounded-full border border-teal-500/40 px-7 py-3 text-sm font-semibold text-teal-300 transition-colors hover:bg-teal-500/10 hover:text-teal-200"
              >
                Explore More
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
