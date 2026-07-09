// src/components/ui.tsx
//
// A tiny "UI kit" — small reusable building blocks used across the dashboards.
// Keeping them here means every card/badge looks the same and we style them in
// ONE place. As the app grows this is where shared visual pieces live.

import type { ReactNode } from "react";

// A rounded bordered box — the basic container for a chunk of content.
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
        "rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 " + className
      }
    >
      {children}
    </div>
  );
}

// A small coloured label — e.g. a position or a status.
export function Badge({
  children,
  color = "zinc",
}: {
  children: ReactNode;
  color?: "emerald" | "indigo" | "amber" | "zinc";
}) {
  // Map a colour name to Tailwind classes (light + dark).
  const colors: Record<string, string> = {
    emerald:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    indigo:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };
  return (
    <span
      className={
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium " +
        colors[color]
      }
    >
      {children}
    </span>
  );
}

// A small uppercase heading used above a section of content.
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {children}
    </h2>
  );
}
