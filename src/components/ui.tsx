// src/components/ui.tsx
//
// Shared UI building blocks in the AthletIQ design system: dark surfaces, teal
// accents, green primary actions, glassmorphism cards. Used across the player
// (and later coach) pages so everything looks like one product.

import type { ReactNode } from "react";

/* ─── Reusable class strings ─────────────────────────────────────────── */

// Dark form input.
export const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white " +
  "placeholder-white/30 outline-none transition focus:border-teal-500";

// Primary action button (green filled, black text).
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-green-500 px-5 py-2.5 text-sm " +
  "font-semibold text-black transition hover:bg-green-400 active:scale-[0.98] disabled:opacity-50";

// Secondary / ghost button (translucent, white text).
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-2.5 " +
  "text-sm font-medium text-white transition hover:bg-white/10 active:scale-[0.98] disabled:opacity-50";

/* ─── Components ─────────────────────────────────────────────────────── */

// A glass card — the basic container for a chunk of content.
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm " + className
      }
    >
      {children}
    </div>
  );
}

// A small coloured label. `emerald` is kept as an alias of `green` and `indigo`
// stays available so existing (not-yet-restyled) pages keep compiling.
export function Badge({
  children,
  color = "teal",
}: {
  children: ReactNode;
  color?: "teal" | "green" | "emerald" | "indigo" | "amber" | "zinc";
}) {
  const colors: Record<string, string> = {
    teal: "bg-teal-500/10 text-teal-300 border-teal-500/20",
    green: "bg-green-500/10 text-green-300 border-green-500/20",
    emerald: "bg-green-500/10 text-green-300 border-green-500/20",
    indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    zinc: "bg-white/5 text-white/70 border-white/10",
  };
  return (
    <span
      className={
        "inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium " + colors[color]
      }
    >
      {children}
    </span>
  );
}

// A small uppercase teal heading used above a section of content.
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
      {children}
    </h2>
  );
}
