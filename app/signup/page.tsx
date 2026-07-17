"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    // 1. Create the auth user. We stash name + role in the user's metadata too.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: "player" } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    // With email confirmation OFF, signUp logs the user straight in (we get a
    // session). If there's no session, confirmation is still ON in Supabase.
    if (!data.session) {
      setError(
        "Account created, but email confirmation is on. Turn it off in Supabase (Auth → Providers → Email) for the demo, or confirm via email."
      );
      setBusy(false);
      return;
    }

    // 2. Create the profile row (role = player).
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user!.id, role: "player", name });

    if (profileError) {
      setError(profileError.message);
      setBusy(false);
      return;
    }

    // 3. Off to set up their football profile (the onboarding wizard).
    router.push("/player/getting-started");
  }

  return (
    <main 
      className="flex min-h-screen w-full"
      style={{
        background: `
          radial-gradient(circle 1200px at 0% 100%,
            rgba(20,184,166,0.25) 0%,
            rgba(20,184,166,0.12) 30%,
            rgba(13,148,136,0.08) 50%,
            transparent 70%),
          radial-gradient(circle 800px at 100% 0%,
            rgba(16,185,129,0.15) 0%,
            rgba(16,185,129,0.05) 40%,
            transparent 60%),
          linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #050505 100%)
        `,
      }}
    >
      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-8 right-8 z-20 text-sm font-medium text-white/50 transition-colors hover:text-white"
      >
        Back to home
      </Link>

      {/* Left Panel - Branding */}
      <div className="relative hidden lg:flex flex-col w-1/2">
        {/* Logo */}
        <div className="absolute z-10 top-8 left-8">
          <Link href="/" className="block">
            <Image
              src="/logo_new.png"
              alt="AthleteIQ"
              width={160}
              height={44}
              style={{ height: "auto", width: "160px" }}
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col justify-center flex-1 px-16 pl-32">
          <h1 className="text-6xl font-bold leading-tight">
            <span className="block text-white">Start Your</span>
            <span className="block text-white">Journey to</span>
            <span className="block text-teal-500">Excellence</span>
          </h1>

          <p className="text-lg text-gray-400 mt-6 max-w-md leading-relaxed">
            Join thousands of footballers using AI-powered coaching to reach their full potential. Your personalized training starts here.
          </p>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 min-h-screen px-6">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-6">
          <Link href="/" className="block">
            <Image
              src="/logo_new.png"
              alt="AthleteIQ"
              width={140}
              height={38}
              style={{ height: "auto", width: "140px" }}
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* Signup Card */}
        <div
          className="w-full max-w-md rounded-2xl p-8"
          style={{
            background: "rgba(10, 10, 10, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Heading */}
          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Create your account
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Sign up to start training smarter
          </p>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Sam Rivera"
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="at least 6 characters"
                  className="w-full pl-12 pr-12 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 outline-none focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-500 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Creating account…" : "Sign up"}
              {!busy && (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              )}
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-gray-400 pt-2">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-teal-500 hover:text-teal-400 transition-colors">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
