"use client";

// Closing call-to-action — a full-bleed green band (no card). Mission-led,
// aimed at young players who don't have elite-academy tools.

import Link from "next/link";
import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function CTASection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #16a34a 0%, #22c55e 55%, #16a34a 100%)",
        paddingTop: "64px",
        paddingBottom: "64px",
      }}
    >
      {/* soft light bloom */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-[70%] -translate-x-1/2"
        style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.16) 0%, transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-[1400px] px-6 text-center lg:px-12"
      >
        <h2
          className="mx-auto max-w-3xl font-extrabold text-white"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
        >
          Elite-level coaching, for every young player
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/85">
          You don’t need an academy budget to train like a pro. Start logging today and let AthletIQ
          build the plan around you.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {/* Primary — white on green so it pops */}
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2.5 rounded-md bg-white px-8 py-3.5 text-base font-semibold text-[#065f46] transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98]"
          >
            Start Training
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
              <path d="M6 3l6 5-6 5" />
            </svg>
          </Link>
          {/* Secondary — outlined white */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 rounded-md border border-white/50 px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:bg-white/10 active:scale-[0.98]"
          >
            I already have an account
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
