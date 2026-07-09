// src/lib/supabase/server.ts
//
// The SERVER Supabase client, for use in API route handlers and server
// components. It reads the login session from cookies (set by the browser
// client), so code running on the server knows WHO is logged in and RLS applies
// as that user.
//
// Usage (must be awaited):
//   const supabase = await createServerSupabase();
//   const { data: { user } } = await supabase.auth.getUser();

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In some contexts (e.g. server components) cookies can't be set;
          // wrapping in try/catch keeps that from crashing.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore — the middleware refreshes the session cookie instead
          }
        },
      },
    }
  );
}
