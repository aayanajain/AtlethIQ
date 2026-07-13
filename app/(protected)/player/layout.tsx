"use client";
// app/(protected)/player/layout.tsx
//
// The PLAYER-side shell — sidebar + content, in the dark/teal design system.
// It wraps every player page. Client component so it can highlight the active
// link (usePathname) and sign the user out.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

// The sidebar links. `underDev` marks a page that isn't finished yet.
const NAV = [
  { href: "/player", label: "Dashboard", underDev: false },
  { href: "/player/session", label: "Today's Session", underDev: false },
  { href: "/player/plan", label: "Plan", underDev: false },
  { href: "/player/journey", label: "Journey", underDev: false },
  { href: "/player/mentor", label: "AI Mentor", underDev: true },
];

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* ── Sidebar (fixed height, never scrolls with the page) ── */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-hidden border-r border-white/[0.06] px-5 py-7">
        {/* Brand + role */}
        <div className="px-2">
          <div className="text-lg font-semibold tracking-tight text-white">AthletIQ</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-teal-400/80">
            Player
          </div>
        </div>

        {/* Nav links */}
        <nav className="mt-10 flex-1 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "group relative flex items-center justify-between rounded-md px-3 py-2.5 text-sm tracking-wide transition-colors " +
                  (active
                    ? "bg-white/[0.04] font-medium text-white"
                    : "text-white/45 hover:text-white/90")
                }
              >
                {/* Active accent bar */}
                <span
                  className={
                    "absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-teal-400 transition-opacity " +
                    (active ? "opacity-100" : "opacity-0")
                  }
                />
                <span>{item.label}</span>
                {item.underDev && (
                  <span className="rounded border border-amber-400/25 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-400/70">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Log out */}
        <div className="border-t border-white/[0.06] pt-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2.5 text-left text-sm tracking-wide text-white/40 transition-colors hover:text-white/90"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* ── Page content ── */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
