"use client";
// app/(protected)/player/layout.tsx
//
// The PLAYER-side shell. Because it's a layout inside app/(protected)/player/,
// it automatically wraps EVERY player page (/player, /player/mentor, etc.) with
// this sidebar — we don't add the sidebar to each page by hand.
//
// It's a client component ("use client") because it uses usePathname() to know
// which nav link is currently active and highlight it.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

// The sidebar links. `underDev` shows an amber "under development" dot.
const NAV = [
  { href: "/player", label: "Dashboard", icon: "🏠", underDev: false },
  { href: "/player/mentor", label: "AI mentor", icon: "🤖", underDev: true },
];

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // the current URL path, e.g. "/player"
  const router = useRouter();

  // Real sign-out: clear the session, then go back to the public home.
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* --- Sidebar --- */}
      <aside className="flex w-52 shrink-0 flex-col border-r border-zinc-200 p-4 dark:border-zinc-800">
        {/* Brand + role */}
        <div>
          <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            AthletIQ
          </div>
          <div className="text-xs font-medium text-emerald-600">Player</div>
        </div>

        {/* Nav links */}
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition " +
                  (active
                    ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900")
                }
              >
                <span>
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </span>
                {/* Amber dot = "under development" (only on unfinished pages) */}
                {item.underDev && (
                  <span
                    title="Under development"
                    className="h-2 w-2 rounded-full bg-amber-400"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Log out at the bottom */}
        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          ← Log out
        </button>
      </aside>

      {/* --- Page content --- */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
