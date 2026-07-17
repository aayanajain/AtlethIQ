"use client";

// Public site footer. Kept simple and honest — links point to the real routes
// that exist, plus a note that AthletIQ is built for (and safe for) minors.

import Image from "next/image";
import Link from "next/link";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Explore",
    links: [
      { label: "Features", href: "/#features-heading" },
      { label: "Why AthletIQ", href: "/#about-heading" },
      { label: "How it works", href: "/#how-heading" },
      { label: "Players & coaches", href: "/#audience-heading" },
      { label: "Reviews", href: "/#reviews-heading" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Create account", href: "/signup" },
      { label: "Log in", href: "/login" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative w-full border-t border-white/[0.06]" style={{ background: "#050505" }}>
      <div className="mx-auto max-w-[1400px] px-6 py-9 lg:px-12">
        <div className="grid gap-8 md:grid-cols-[1.8fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Image
              src="/logo_new.png"
              alt="AthletIQ"
              width={200}
              height={55}
              style={{ height: "40px", width: "auto", mixBlendMode: "screen" }}
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              An affordable AI sports scientist and mentor for young footballers, and a tool that
              helps coaches track every player individually.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                {col.heading}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} AthletIQ. Built for young athletes.
          </p>
          <p className="text-xs text-white/35">
            Designed to be safe and encouraging for players aged 10–18.
          </p>
        </div>
      </div>
    </footer>
  );
}
