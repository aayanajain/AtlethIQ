"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";

/* ─── Animation Variants ─────────────────────────────────────────── */
import type { Variants } from "framer-motion";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: EASE_OUT_EXPO },
  }),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.9, delay, ease: "easeOut" as const },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.1, ease: EASE_OUT_EXPO },
  },
};

/* ─── Floating Football ──────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "backdrop-blur-xl bg-[#050505]/70 border-b border-white/[0.06] shadow-lg shadow-black/30"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center opacity-90 hover:opacity-100 transition-opacity duration-200">
          <Image
            src="/logo_new.png"
            alt="AthleteIQ"
            width={200}
            height={55}
            style={{ height: "44px", width: "auto", mixBlendMode: "screen" }}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/50">
          {["About", "Features", "Coaches", "Pricing", "Contact"].map((item) => (
            <a
              key={item}
              href="#"
              className="relative font-medium transition-colors duration-250 hover:text-white group"
            >
              {item}
              <span className="absolute left-0 right-0 bottom-[-4px] h-[2px] bg-[#14b8a6] scale-x-0 group-hover:scale-x-100 transition-transform duration-250 origin-left" />
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors duration-250 font-medium">
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold px-5 py-2 rounded-md text-white border transition-all duration-200 hover:bg-[#22c55e] hover:border-[#22c55e] hover:text-white active:scale-[0.98]"
            style={{ border: "1.5px solid #22c55e", color: "#22c55e" }}
          >
            Join Academy
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white p-2" aria-label="Menu">
          <div className="w-5 space-y-1.5">
            <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px bg-current transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/[0.06] backdrop-blur-xl bg-[#050505]/90 px-6 pb-6 pt-4 space-y-4"
          >
            {["About", "Features", "Coaches", "Pricing", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                className="block text-white/50 hover:text-white transition-colors duration-250 py-1 text-sm font-medium"
              >
                {item}
              </a>
            ))}
            <Link href="/signup" className="block text-center font-semibold text-sm px-5 py-2.5 rounded-md text-[#22c55e] mt-3 border"
              style={{ border: "1.5px solid #22c55e" }}>
              Join Academy
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ─── Floating Football ──────────────────────────────────────────── */
function FloatingBall({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.div
      style={style}
      animate={{ y: [0, -14, 0], rotate: [0, 8, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute pointer-events-none select-none z-20"
    >
      <svg viewBox="0 0 64 64" className="w-14 h-14 opacity-80 drop-shadow-xl">
        <circle cx="32" cy="32" r="30" fill="#111" stroke="#14b8a6" strokeWidth="1.2" />
        <path d="M32 2c0 0-8 8-8 30s8 30 8 30" stroke="#14b8a6" strokeWidth="0.8" fill="none" opacity="0.5" />
        <path d="M2 32c0 0 8-8 30-8s30 8 30 8" stroke="#14b8a6" strokeWidth="0.8" fill="none" opacity="0.5" />
        <path d="M14 10 Q32 32 50 54" stroke="#14b8a650" strokeWidth="0.6" fill="none" />
        <path d="M14 54 Q32 32 50 10" stroke="#14b8a650" strokeWidth="0.6" fill="none" />
        <polygon points="32,14 38,22 34,30 30,30 26,22" fill="#14b8a6" opacity="0.25" />
        <polygon points="18,28 26,30 28,38 22,42 14,36" fill="#14b8a6" opacity="0.2" />
        <polygon points="46,28 38,30 36,38 42,42 50,36" fill="#14b8a6" opacity="0.2" />
      </svg>
    </motion.div>
  );
}

/* ─── Main Hero ──────────────────────────────────────────────────── */
export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 25 });
  const imgX = useTransform(springX, [-1, 1], ["-18px", "18px"]);
  const imgY = useTransform(springY, [-1, 1], ["-12px", "12px"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <>
      <Navbar />

      {/* ── Hero wrapper ── */}
      <section
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full overflow-hidden"
        style={{
          minHeight: "100svh",
        }}
        aria-label="Hero section"
      >
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/home_bg.png"
            alt="Football player kicking ball in stadium"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            quality={95}
          />
          {/* Dark gradient overlay from left */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.25) 70%, transparent 100%)",
            }}
          />
          {/* Bottom gradient */}
          <div
            className="absolute bottom-0 left-0 right-0 h-48"
            style={{
              background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.9))",
            }}
          />
        </div>

        {/* Content container */}
        <div
          className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 h-full flex items-center"
          style={{ minHeight: "100svh" }}
        >
          {/* LEFT — Content */}
          <div className="max-w-2xl pt-24 pb-32">

            {/* Headline */}
            <motion.h1
              custom={0.15}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-extrabold leading-[1.05] tracking-tight text-white mb-8"
              style={{
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
              }}
            >
              TRAIN SMART<br />
              PLAY BETTER
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              custom={0.3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-base lg:text-lg leading-relaxed mb-10 text-white/80"
            >
              Personalized training. Performance tracking.<br />
              Live coach interaction. All in one place.
            </motion.p>

            {/* Buttons */}
            <motion.div
              custom={0.45}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center gap-4"
            >
              {/* Primary — green filled */}
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-md font-semibold text-base text-black bg-[#22c55e] transition-all duration-300 hover:bg-[#16a34a] hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Training
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
                  <path d="M6 3l6 5-6 5" />
                </svg>
              </Link>

              {/* Secondary — transparent with icon */}
              <button
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-md font-semibold text-base text-white transition-all duration-300 hover:bg-white/10 active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-colors">
                  <svg viewBox="0 0 16 16" fill="white" className="w-3 h-3 ml-0.5">
                    <path d="M5 3.5v9l7-4.5-7-4.5z" />
                  </svg>
                </span>
                Watch Demo
              </button>
            </motion.div>
          </div>
        </div>

        {/* Floating football */}
        <FloatingBall style={{ bottom: "15%", right: "8%", zIndex: 20 }} />
      </section>

    </>
  );
}
