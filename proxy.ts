// proxy.ts (Next.js 16's replacement for the old "middleware.ts")
//
// Runs on the server for (almost) every request BEFORE the page renders.
// Two jobs:
//   1. Keep the Supabase login session fresh (refresh the cookie).
//   2. Guard the player area: if you're not logged in and you try to open
//      any /player page, bounce you to /login.
//
// The coach area is intentionally left open for now (player-side-only auth).

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  // Start with a response we can attach refreshed cookies to.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This call refreshes the session if needed and tells us who's logged in.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Gate: no user + trying to reach a player page → send to login.
  if (!user && request.nextUrl.pathname.startsWith("/player")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// Run on all routes except static assets and API routes.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.).*)"],
};
