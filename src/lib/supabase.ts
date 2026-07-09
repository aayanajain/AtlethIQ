// src/lib/supabase.ts
//
// The BROWSER Supabase client, for use in client components ("use client").
// We now use @supabase/ssr's createBrowserClient instead of the plain client so
// the login session is stored in COOKIES. Cookies can be read on the server
// too, which is what makes real auth (and our redirect gate) work.
//
// Import anywhere on the client with:
//   import { supabase } from "@/src/lib/supabase";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server."
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
