// src/lib/supabase.ts
//
// A single shared Supabase client for the browser (client components).
// It uses the anon public key, which is safe to expose (see CLAUDE.md rule #2):
// Row Level Security is what actually protects the data.
//
// Import this anywhere on the client with:
//   import { supabase } from "@/src/lib/supabase";

import { createClient } from "@supabase/supabase-js";

// These come from .env.local. The NEXT_PUBLIC_ prefix is what makes Next.js
// include them in the browser bundle.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail loudly during dev if the env vars are missing, instead of a confusing
// "fetch failed" later. If you hit this, fill in .env.local and restart `npm run dev`.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
