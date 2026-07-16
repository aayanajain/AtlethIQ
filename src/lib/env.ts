// src/lib/env.ts
//
// Environment variable validation and type-safe access.
// Ensures required environment variables are present at build time.

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];
  
  if (!value && required) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please add it to your .env.local file.`
    );
  }
  
  return value || "";
}

// Validate and export environment variables
export const env = {
  // Supabase (client-side safe)
  supabase: {
    url: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  },
  
  // Server-side only
  supabaseServiceKey: getEnvVar("SUPABASE_SERVICE_ROLE_KEY", false),
  
  // Node environment
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;

// Validate on import
if (typeof window === "undefined") {
  // Server-side validation
  console.log("✓ Environment variables validated");
}
