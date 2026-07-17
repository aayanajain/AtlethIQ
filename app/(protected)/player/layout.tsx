"use client";
// app/(protected)/player/layout.tsx
//
// The PLAYER-side shell — sidebar + content, in the dark/teal design system.
// It wraps every player page. Client component so it can highlight the active
// link (usePathname) and sign the user out.
//
// ONBOARDING FLOW CONTROL:
// - Checks if player has completed onboarding
// - Redirects to getting-started if not completed (unless already there)
// - Blocks access to getting-started if already completed (unless DEV_MODE)

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

// ─── DEV MODE TOGGLE ───────────────────────────────────────────────────
const DEV_MODE = false; // Set to false in production
// ───────────────────────────────────────────────────────────────────────

// The sidebar links. `underDev` marks a page that isn't finished yet.
const NAV = [
  { href: "/player", label: "Dashboard", underDev: false },
  { href: "/player/session", label: "Today's Session", underDev: false },
  { href: "/player/plan", label: "Plan", underDev: false },
  { href: "/player/journey", label: "Journey", underDev: false },
  { href: "/player/mentor", label: "AI Mentor", underDev: true },
  { href: "/player/coach", label: "Coach", underDev: true },
];

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check onboarding status and handle routing
  useEffect(() => {
    async function checkOnboarding() {
      // Skip checks in dev mode
      if (DEV_MODE) {
        setCheckingOnboarding(false);
        return;
      }

      // Don't check if already on getting-started page
      if (pathname === "/player/getting-started") {
        setCheckingOnboarding(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Not logged in -> straight to login (no profile to check).
        router.replace("/login");
        return;
      }

      const { data: player } = await supabase
        .from("players")
        .select("onboardingCompleted")
        .eq("id", user.id)
        .maybeSingle();

      if (!player) {
        // No profile exists -> redirect to getting-started
        router.replace("/player/getting-started");
        return;
      }

      if (!player.onboardingCompleted) {
        // Profile exists but onboarding not complete -> redirect to getting-started
        router.replace("/player/getting-started");
        return;
      }

      // Onboarding is complete, allow access
      setOnboardingComplete(true);
      setCheckingOnboarding(false);
    }

    checkOnboarding();
  }, [pathname, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // Show loading during onboarding check (only in production mode)
  if (checkingOnboarding && !DEV_MODE) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-center">
          <div className="mb-4 text-2xl">⚽</div>
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  // Hide sidebar on getting-started page
  const showSidebar = pathname !== "/player/getting-started";

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* ── Sidebar (only show if not on getting-started) ── */}
      {showSidebar && (
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

          {/* Dev Mode Indicator */}
          {DEV_MODE && (
            <div className="mb-4 rounded-xl border-2 border-amber-500/40 bg-amber-500/15 px-4 py-5 text-center">
              <p className="text-2xl font-extrabold tracking-wide text-amber-300">DEV MODE</p>
              <p className="mt-3 text-sm font-bold leading-snug text-amber-200">
                NOT TO BE DISABLED BY AAYANA.
              </p>
              <p className="mt-2 text-xs font-semibold leading-snug text-amber-400/90">
                AAYANA MUST WORK ON UI CHANGES — THIS I WILL DO AS IT MAY BE A BIT TRICKY.
              </p>
            </div>
          )}

          {/* Profile + Log out, pinned at the bottom */}
          <div className="space-y-0.5 border-t border-white/[0.06] pt-4">
            <Link
              href="/player/profile"
              className={
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm tracking-wide transition-colors " +
                (pathname === "/player/profile"
                  ? "bg-white/[0.04] font-medium text-white"
                  : "text-white/45 hover:text-white/90")
              }
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Profile</span>
            </Link>
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
      )}

      {/* ── Page content ── */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
