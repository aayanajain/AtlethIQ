// src/components/PublicHeader.tsx
//
// The top navigation bar shown on the PUBLIC (pre-login) pages: Home and About.
// Kept as one shared component so both pages have the exact same header and we
// only edit it in one place. This is a reusable UI component — the first entry
// in what will become our src/components/ folder.

import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      {/* Brand — clicking it always returns you home. */}
      <Link href="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
        AthletIQ
      </Link>

      {/* Public links. Login is highlighted as the main call to action. */}
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/about" className="text-zinc-600 hover:underline dark:text-zinc-400">
          About
        </Link>
        <Link
          href="/login"
          className="rounded-full bg-emerald-600 px-4 py-1.5 font-medium text-white hover:bg-emerald-700"
        >
          Login
        </Link>
      </nav>
    </header>
  );
}
