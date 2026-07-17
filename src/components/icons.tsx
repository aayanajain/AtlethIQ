// src/components/icons.tsx
//
// A single, consistent set of lucide-style line icons for the app. One visual
// language everywhere: 24×24 grid, currentColor stroke, 1.6 weight, round caps.
// This replaces the grab-bag of emoji (👤 🌱 ⭐ 🌅) + ad-hoc SVGs the early
// onboarding screens used, which read as childish and never matched the dark +
// teal home page. Colour is inherited via `currentColor`, so callers set it with
// a text-* class.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

// Shared wrapper so every icon has identical geometry and stroke feel.
function Svg({ className = "h-6 w-6", children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ─── Form / navigation ──────────────────────────────────────────────── */

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Svg>
);

export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </Svg>
);

export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8l1.6 2.4L16 12l-2.4 1.6L12 16l-1.6-2.4L8 12l2.4-1.6L12 8Z" />
  </Svg>
);

/* ─── Playing positions (solid, borderless — reads richer) ───────────── */

// Solid wrapper: filled glyphs, no stroke outline.
function SvgSolid({ className = "h-7 w-7", children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

// Goalkeeper — a solid keeper's glove.
export const GloveSolidIcon = (p: IconProps) => (
  <SvgSolid {...p}>
    <path d="M6 12.8V6.5a1.5 1.5 0 0 1 3 0V11h.6V4.5a1.5 1.5 0 0 1 3 0V11h.6V5.5a1.5 1.5 0 0 1 3 0V11h.6v-.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-1.7a6 6 0 0 1-4.27-1.78l-3.5-3.55a1.6 1.6 0 0 1 2.29-2.24L6 15.4Z" />
  </SvgSolid>
);

// Centre-back — a solid shield: secure at the back.
export const ShieldSolidIcon = (p: IconProps) => (
  <SvgSolid {...p}>
    <path d="M12 2 4 5v7c0 6 8 10 8 10s8-4 8-10V5l-8-3Z" />
  </SvgSolid>
);

// Full-back — a solid up-arrow: overlapping runs forward.
export const ArrowUpSolidIcon = (p: IconProps) => (
  <SvgSolid {...p}>
    <path d="M12 3 3.5 11.5h4.5V21h8v-9.5h4.5L12 3Z" />
  </SvgSolid>
);

// Winger — a solid lightning bolt: electric pace on the flank.
export const BoltSolidIcon = (p: IconProps) => (
  <SvgSolid {...p}>
    <path d="M13.5 2 4 13.2h5.4l-1.4 8.8L20 10.4h-5.6l1.5-8.4Z" />
  </SvgSolid>
);

// Striker — a solid studded boot.
export const BootSolidIcon = (p: IconProps) => (
  <SvgSolid {...p}>
    <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H9a1.5 1.5 0 0 1 1.4.96L11.9 9H18a4 4 0 0 1 4 4v1.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 14.5V5.5Z" />
    <rect x="5" y="17.5" width="2" height="3" rx="1" />
    <rect x="9.5" y="17.5" width="2" height="3" rx="1" />
    <rect x="14" y="17.5" width="2" height="3" rx="1" />
    <rect x="18" y="17.5" width="2" height="3" rx="1" />
  </SvgSolid>
);

/* ─── Playing positions (outline set — kept for reference) ───────────── */

// Goalkeeper — an open keeper's glove (lucide "hand").
export const GloveIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 11V6a2 2 0 0 0-4 0" />
    <path d="M14 10V4a2 2 0 0 0-4 0v2" />
    <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </Svg>
);

// Centre-back — shield with a check: solid, secure at the back.
export const ShieldCheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

// Defensive mid — an anchor: sits deep and holds.
export const AnchorIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="5" r="2.5" />
    <path d="M12 21V7.5" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
  </Svg>
);

// Central mid — a compass: the box-to-box engine that sets direction.
export const CompassIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <polygon points="16 8 10.5 10.5 8 16 13.5 13.5 16 8" />
  </Svg>
);

// Winger — motion trails into a forward chevron: pace down the flank.
export const SpeedIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 12h9" />
    <path d="M4 8h9" />
    <path d="M4 16h7" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);

// Striker — a studded football boot.
export const BootIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6v7a2 2 0 0 0 2 2h13a3 3 0 0 0 0-6l-5-.5L11 6H3Z" />
    <path d="M6 15v2M10 15v2M14 15v2M17.5 15v1.5" />
  </Svg>
);

/* ─── Body / physical ────────────────────────────────────────────────── */

export const FootIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.5 3c1.5 0 2.5 1.4 2.5 4 0 3-.8 5-.8 7.5 0 2-.9 3.5-2.7 3.5S5 20.5 5 18c0-2.2 1-3.4 1-6.5C6 6 6.8 3 8.5 3Z" />
    <path d="M16 8c1.1 0 1.8.9 1.8 2.4 0 1.5-.6 2.3-.6 3.6 0 1.1-.6 1.9-1.6 1.9s-1.5-.9-1.5-2c0-1.3.5-2 .5-3.6C14.6 9 15 8 16 8Z" />
  </Svg>
);

export const RulerIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M4 9h3M17 9h3M4 15h3M17 15h3" />
  </Svg>
);

/* ─── Fitness levels ─────────────────────────────────────────────────── */

export const SproutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 20h10M12 20V9" />
    <path d="M12 9C12 6 9.5 4 6 4c0 3 2.5 5 6 5Z" />
    <path d="M12 12c0-2.5 2-4.5 5-4.5 0 2.5-2 4.5-5 4.5Z" />
  </Svg>
);

export const DumbbellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 6.5 17.5 17.5M4 8l1-1M20 16l-1 1" />
    <path d="M3 11l2-2 3 3-2 2zM21 13l-2 2-3-3 2-2z" />
  </Svg>
);

export const FlameIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-1.5.6-2.7 1.4-3.6C9 8.8 9 7 8.5 5.5c2 .5 3 2 3.5 3.5.6-2 0-4 0-7Z" />
  </Svg>
);

/* Level meters — ascending "equalizer" bars, one filled step per level.
   Reads instantly as beginner → intermediate → advanced. */

export const LevelLowIcon = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M6 20v-7" />
    <path d="M12 20v-3" />
    <path d="M18 20v-3" />
  </Svg>
);

export const LevelMidIcon = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M6 20v-7" />
    <path d="M12 20v-11" />
    <path d="M18 20v-3" />
  </Svg>
);

export const LevelHighIcon = (p: IconProps) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M6 20v-7" />
    <path d="M12 20v-11" />
    <path d="M18 20v-15" />
  </Svg>
);

/* ─── Goals ──────────────────────────────────────────────────────────── */

export const HeartPulseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 14c1.5-1.5 3-3.4 3-5.5A4.5 4.5 0 0 0 12 5.7 4.5 4.5 0 0 0 2 8.5c0 2.1 1.5 4 3 5.5l7 7Z" />
    <path d="M3.5 12h4l2-3 3 5 2-3h4" />
  </Svg>
);

export const StarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8-4.3-4.1 5.9-.9L12 3Z" />
  </Svg>
);

export const ScoutIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
    <path d="M11 8v6M8 11h6" />
  </Svg>
);

export const TrophyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" />
    <path d="M6 6H4a2 2 0 0 0 0 4h2M18 6h2a2 2 0 0 1 0 4h-2" />
    <path d="M12 13v3M9 20h6M10 20v-1a2 2 0 0 1 4 0v1" />
  </Svg>
);

export const GaugeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 16a9 9 0 1 1 17 0" />
    <path d="M12 13l4-3.5" />
    <circle cx="12" cy="14" r="1.4" />
  </Svg>
);

export const TargetIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1.2" />
  </Svg>
);

export const TrendingUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M17 7h4v4" />
  </Svg>
);

/* ─── Time of day ────────────────────────────────────────────────────── */

export const SunriseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v3M5.6 9.6 4 8M18.4 9.6 20 8M2 18h20M6 18a6 6 0 0 1 12 0" />
    <path d="M9 6l3-3 3 3" />
  </Svg>
);

export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const MoonIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12.8A8 8 0 1 1 11.2 3a6.2 6.2 0 0 0 9.8 9.8Z" />
  </Svg>
);
