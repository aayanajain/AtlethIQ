"use client";
// app/(protected)/coach/layout.tsx
//
// The COACH-side shell — sidebar + content, matching the player shell in the
// dark/teal design system. Access is gated: only the emails listed in
// NEXT_PUBLIC_COACH_EMAILS may open the coach side; anyone else is bounced home.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

// Allowed coach emails come from the env allowlist (comma-separated). Only
// these accounts may open the coach side — everyone else is shown an
// "unauthorized" screen. No dev bypass: the gate is always on.
const COACH_EMAILS = (process.env.NEXT_PUBLIC_COACH_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// The sidebar links. Just the dashboard for now, and it isn't finished yet.
const NAV = [{ href: "/coach", label: "Dashboard", underDev: true }];

type Access = "checking" | "authorized" | "unauthorized";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [access, setAccess] = useState<Access>("checking");

  // Gate access to the two allowed coach accounts.
  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not signed in -> send them to log in as a coach.
        router.replace("/login?role=coach");
        return;
      }

      const email = (user.email ?? "").toLowerCase();
      setAccess(COACH_EMAILS.includes(email) ? "authorized" : "unauthorized");
    }

    checkAccess();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // Hold the UI back until the access check resolves.
  if (access === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-center">
          <div className="mb-4 text-2xl">⚽</div>
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Signed in, but not one of the allowed coach accounts.
  if (access === "unauthorized") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500 sm:text-xl">
            You are not authorized to access the coach area.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 rounded-md border border-white/[0.12] px-5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-hidden border-r border-white/[0.06] px-5 py-7">
        {/* Brand + role */}
        <div className="px-2">
          <div className="text-lg font-semibold tracking-tight text-white">AthletIQ</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-teal-400/80">
            Coach
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

        {/* Log out, pinned at the bottom */}
        <div className="border-t border-white/[0.06] pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm tracking-wide text-white/40 transition-colors hover:text-white/90"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ── Page content ── */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
