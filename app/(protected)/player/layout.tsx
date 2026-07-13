"use client";
// app/(protected)/player/layout.tsx
//
// The PLAYER-side shell — sidebar + content, in the dark/teal design system.
// It wraps every player page. Client component so it can highlight the active
// link (usePathname) and sign the user out.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

// The sidebar links. `underDev` shows an amber "under development" dot.
const NAV = [
  { href: "/player", label: "Dashboard", icon: "🏠", underDev: false },
  { href: "/player/session", label: "Today's Session", icon: "📝", underDev: false },
  { href: "/player/plan", label: "Progress", icon: "📈", underDev: false },
  { href: "/player/mentor", label: "AI mentor", icon: "🤖", underDev: true },
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
      {/* ── Sidebar ── */}
      <aside className="flex w-52 shrink-0 flex-col border-r border-white/[0.08] p-4">
        {/* Brand + role */}
        <div>
          <div className="text-lg font-bold text-white">AthletIQ</div>
          <div className="text-xs font-semibold uppercase tracking-widest text-teal-400">
            Player
          </div>
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
                    ? "bg-teal-500/10 font-medium text-teal-300"
                    : "text-white/60 hover:bg-white/5 hover:text-white")
                }
              >
                <span>
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </span>
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

        {/* Log out */}
        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-left text-sm text-white/40 transition hover:bg-white/5 hover:text-white"
        >
          ← Log out
        </button>
      </aside>

      {/* ── Page content ── */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
