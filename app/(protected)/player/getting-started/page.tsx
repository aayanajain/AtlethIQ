"use client";
// app/(protected)/player/getting-started/page.tsx
//
// Multi-step onboarding wizard for new players. This is shown ONCE when a
// player first signs up (onboardingCompleted = false). It collects comprehensive
// profile information across 6 steps, then saves everything in a single INSERT
// at the end.
//
// Steps:
// 1. Personal Information (name, DOB, gender)
// 2. Football Details (position, foot, years playing, club)
// 3. Physical Details (height, weight, fitness level)
// 4. Goals (predefined + custom)
// 5. Availability (training days, time, duration)
// 6. Review & Create Profile
//
// Navigation: Back/Next buttons, progress indicator, can't skip required fields.
// Data is stored in local state until final submit (no partial saves).
//
// UI: built to the AthletIQ design system — committed dark (#050505), teal brand
// accents, green primary actions, glass cards, Geist headlines, framer-motion.
// One consistent line-icon set (src/components/icons) replaces the old emoji.
//
// DEV MODE: Set DEV_MODE = true to always show this page for testing,
// bypassing the onboardingCompleted check.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { supabase } from "@/src/lib/supabase";

// ─── DEV MODE TOGGLE ───────────────────────────────────────────────────
const DEV_MODE = true; // Set to false in production
// ───────────────────────────────────────────────────────────────────────
import type {
  Player,
  Position,
  Gender,
  DominantFoot,
  FitnessLevel,
  PreferredTime,
  TrainingDay,
} from "@/src/types";
import {
  GENDER_OPTIONS,
  DOMINANT_FOOT_OPTIONS,
  FITNESS_LEVELS,
  PREDEFINED_GOALS,
  PREFERRED_TIME_OPTIONS,
  TRAINING_DAYS_OPTIONS,
  SESSION_DURATION_PRESETS,
  calculateAge,
  isValidYouthAge,
} from "@/src/lib/onboarding";
import { ROLES } from "@/src/lib/positions";
import {
  UserIcon,
  CalendarIcon,
  ChevronDownIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  AlertIcon,
  ShieldIcon,
  SparkleIcon,
  DumbbellIcon,
  TargetIcon,
  LevelLowIcon,
  LevelMidIcon,
  LevelHighIcon,
  SunriseIcon,
  SunIcon,
  MoonIcon,
  GloveSolidIcon,
  ShieldSolidIcon,
  ArrowUpSolidIcon,
  BoltSolidIcon,
  BootSolidIcon,
} from "@/src/components/icons";

// Signature ease from the design system (matches the home page motion).
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// The six steps, with an icon each — powers the left context rail.
const STEPS: { label: string; sub: string; icon: IconCmp }[] = [
  { label: "Personal", sub: "Who you are", icon: UserIcon },
  { label: "Football", sub: "Your game", icon: ShieldIcon },
  { label: "Physical", sub: "Your profile", icon: DumbbellIcon },
  { label: "Goals", sub: "What you chase", icon: TargetIcon },
  { label: "Availability", sub: "When you train", icon: CalendarIcon },
  { label: "Review", sub: "Confirm & create", icon: SparkleIcon },
];

// ─── Icon lookups ──────────────────────────────────────────────────────
// The data files (onboarding.ts) still carry emoji strings for legacy callers;
// here we map each option to a proper line icon so the wizard stays on-system.
type IconCmp = (p: { className?: string }) => React.ReactElement;

// Outfield roles get a rich solid glyph; the three midfielders get their
// classic shirt numbers (#6 holding, #8 box-to-box, #10 playmaker).
const POSITION_ICONS: Record<string, IconCmp> = {
  goalkeeper: GloveSolidIcon, // keeper's glove
  "centre-back": ShieldSolidIcon, // secure at the back
  "full-back": ArrowUpSolidIcon, // overlapping forward runs
  winger: BoltSolidIcon, // electric pace down the flank
  striker: BootSolidIcon, // finishing boot
};

const POSITION_NUMBERS: Record<string, string> = {
  "defensive-mid": "6",
  "central-mid": "8",
  "attacking-mid": "10",
};

const FITNESS_ICONS: Record<string, IconCmp> = {
  beginner: LevelLowIcon,
  intermediate: LevelMidIcon,
  advanced: LevelHighIcon,
};

const TIME_ICONS: Record<string, IconCmp> = {
  morning: SunriseIcon,
  afternoon: SunIcon,
  evening: MoonIcon,
};

// Form data interface (what we collect across all steps)
interface OnboardingData {
  // Step 1: Personal
  fullName: string;
  dateOfBirth: string;
  gender: Gender | "";

  // Step 2: Football
  position: Position | "";
  dominantFoot: DominantFoot | "";
  yearsPlaying: number;
  currentClub: string;

  // Step 3: Physical
  height: string;
  weight: string;
  fitnessLevel: FitnessLevel | "";

  // Step 4: Goals
  goals: string[];
  customGoal: string;

  // Step 5: Availability
  trainingDays: TrainingDay[];
  preferredTime: PreferredTime | "";
  sessionDuration: number;
  customDuration: string;
}

const TOTAL_STEPS = 6;

export default function GettingStartedPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back (for motion)
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [data, setData] = useState<OnboardingData>({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    position: "",
    dominantFoot: "",
    yearsPlaying: 0,
    currentClub: "",
    height: "",
    weight: "",
    fitnessLevel: "",
    goals: [],
    customGoal: "",
    trainingDays: [],
    preferredTime: "",
    sessionDuration: 60,
    customDuration: "",
  });

  // Check if user already completed onboarding (redirect if yes)
  // DEV MODE: Skip this check to always show getting-started page
  useEffect(() => {
    async function loadInitial() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // The name the player gave at signup lives in their auth metadata — use it
      // to prefill Full Name for brand-new players.
      const signupName =
        typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "";

      // Load any existing player row so returning users (and dev-mode re-runs)
      // start from their saved answers rather than a blank form.
      const { data: playerRow } = await supabase
        .from("players")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // In production, a completed profile shouldn't see the wizard again.
      // (DEV_MODE keeps it open on purpose for testing.)
      if (!DEV_MODE && playerRow?.onboardingCompleted) {
        router.replace("/player");
        return;
      }

      if (playerRow) {
        const p = playerRow as Player;
        setData({
          fullName: p.fullName || signupName || "",
          dateOfBirth: p.dateOfBirth || "",
          gender: p.gender || "",
          position: p.position || "",
          dominantFoot: p.dominantFoot || "",
          yearsPlaying: p.yearsPlaying ?? 0,
          currentClub: p.currentClub || "",
          height: p.height != null ? String(p.height) : "",
          weight: p.weight != null ? String(p.weight) : "",
          fitnessLevel: p.fitnessLevel || "",
          goals: p.goals || [],
          customGoal: "",
          trainingDays: p.trainingDays || [],
          preferredTime: p.preferredTime || "",
          sessionDuration: p.sessionDuration || 60,
          customDuration: "",
        });
      } else if (signupName) {
        // No profile yet — just seed the name from signup.
        setData((prev) => ({ ...prev, fullName: signupName }));
      }

      setLoading(false);
    }
    loadInitial();
  }, [router]);

  // Validate current step
  function validateStep(step: number): boolean {
    switch (step) {
      case 1: // Personal
        return !!(
          data.fullName.trim() &&
          data.dateOfBirth &&
          data.gender &&
          isValidYouthAge(data.dateOfBirth)
        );
      case 2: // Football
        return !!(data.position && data.dominantFoot && data.yearsPlaying >= 0);
      case 3: // Physical
        return !!data.fitnessLevel;
      case 4: // Goals
        return data.goals.length > 0;
      case 5: // Availability
        return !!(
          data.trainingDays.length > 0 &&
          data.preferredTime &&
          (data.sessionDuration > 0 || parseInt(data.customDuration) > 0)
        );
      case 6: // Review
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields");
      return;
    }
    setError(null);
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setError(null);
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  function jumpToStep(step: number) {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  }

  async function handleSubmit() {
    if (!validateStep(5)) {
      setError("Please complete all required fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Prepare final data
      const finalDuration = data.sessionDuration || parseInt(data.customDuration);

      const playerData = {
        id: user.id,
        fullName: data.fullName.trim(),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender as Gender,
        position: data.position as Position,
        dominantFoot: data.dominantFoot as DominantFoot,
        yearsPlaying: data.yearsPlaying,
        currentClub: data.currentClub.trim() || null,
        height: data.height ? parseInt(data.height) : null,
        weight: data.weight ? parseInt(data.weight) : null,
        fitnessLevel: data.fitnessLevel as FitnessLevel,
        goals: data.goals,
        trainingDays: data.trainingDays,
        preferredTime: data.preferredTime as PreferredTime,
        sessionDuration: finalDuration,
        currentFocus: "",
        language: "en",
        onboardingCompleted: true,
      };

      // Upsert (not insert): the player row's id IS the auth user id, so a
      // returning user — e.g. re-running the wizard while DEV_MODE is on —
      // would otherwise hit a duplicate-primary-key error.
      const { error: insertError } = await supabase.from("players").upsert(playerData);

      if (insertError) throw insertError;

      router.push("/player");
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="flex items-center gap-3 text-white/50">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500/30 border-t-teal-400" />
          <span className="text-sm">Loading your profile…</span>
        </div>
      </div>
    );
  }

  // Content variants — subtle fade + rise tied to nav direction.
  const stepVariants: Variants = {
    enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 20 : -20 }),
    center: { opacity: 1, y: 0 },
    exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -20 : 20 }),
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#08080a] text-white">
      {/* Always-visible teal scrollbar for the content region, so users never
          miss that a step scrolls (overrides thin/overlay OS scrollbars). */}
      <style>{`
        .gs-scroll { scrollbar-width: thin; scrollbar-color: rgba(20,184,166,0.45) transparent; }
        .gs-scroll::-webkit-scrollbar { width: 10px; }
        .gs-scroll::-webkit-scrollbar-track { background: transparent; }
        .gs-scroll::-webkit-scrollbar-thumb {
          background: rgba(20,184,166,0.4);
          border-radius: 9999px;
          border: 2px solid #08080a;
        }
        .gs-scroll::-webkit-scrollbar-thumb:hover { background: rgba(20,184,166,0.65); }
      `}</style>
      {/* ─────────────────── LEFT CONTEXT RAIL (fixed) ──────────────────── */}
      <aside className="relative hidden h-screen w-[36%] max-w-md shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#050506] px-9 py-10 lg:flex xl:px-11">
        {/* Ambient teal glow */}
        <div
          className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96"
          style={{
            background: "radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 68%)",
            filter: "blur(30px)",
          }}
        />

        {/* Brand */}
        <div className="relative">
          <Image
            src="/logo_new.png"
            alt="AthletIQ"
            width={320}
            height={88}
            style={{ height: "64px", width: "auto", mixBlendMode: "screen" }}
            priority
            className="ml-3 mt-3"
          />

          <h1 className="mt-9 text-[26px] font-bold leading-tight tracking-tight">
            Build your
            <br />
            player profile
          </h1>
          <p className="mt-3 max-w-[15rem] text-sm leading-relaxed text-white/45">
            A few quick questions so your AI coach can tailor every drill to you.
          </p>
        </div>

        {/* Vertical step list */}
        <nav className="relative mt-10 space-y-1">
          {STEPS.map((s, index) => {
            const step = index + 1;
            const done = step < currentStep;
            const active = step === currentStep;
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => done && jumpToStep(step)}
                disabled={!done}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition ${
                  active
                    ? "bg-teal-500/10"
                    : done
                    ? "hover:bg-white/[0.04]"
                    : "cursor-default"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                    active
                      ? "border-teal-400/50 bg-teal-500/15 text-teal-300"
                      : done
                      ? "border-teal-500/30 bg-teal-500/10 text-teal-400"
                      : "border-white/10 bg-white/[0.02] text-white/30"
                  }`}
                >
                  {done ? <CheckIcon className="h-4 w-4" /> : <Icon className="h-[18px] w-[18px]" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      active ? "text-white" : done ? "text-white/70" : "text-white/35"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span
                    className={`block text-xs ${active ? "text-teal-300/80" : "text-white/30"}`}
                  >
                    {s.sub}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer — mt-auto pins it to the bottom when there's room, and
            collapses cleanly (no clipped top) when the rail has to scroll. */}
        <p className="relative mt-auto pt-10 text-xs text-white/25">
          Your details stay private and help personalise your plan.
        </p>
      </aside>

      {/* ─────────────────────── RIGHT FORM PANEL ────────────────────────── */}
      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Top bar — fixed (mobile brand + step counter on all sizes) */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-8">
          {/* Greeting — first name from signup / saved profile */}
          <div className="text-sm font-medium text-white/50">
            Hey,{" "}
            <span className="font-semibold text-white">
              {data.fullName.trim().split(" ")[0] || "there"}
            </span>{" "}
            👋
          </div>
          <div className="text-sm font-medium text-white/50">
            Step <span className="text-white">{currentStep}</span> of {TOTAL_STEPS}
          </div>
        </div>

        {/* Scrollable content — the ONLY scroll region */}
        <div className="gs-scroll flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-5 py-8 sm:px-8 sm:py-10">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.32, ease: EASE }}
              >
                {currentStep === 1 && <Step1Personal data={data} setData={setData} />}
                {currentStep === 2 && <Step2Football data={data} setData={setData} />}
                {currentStep === 3 && <Step3Physical data={data} setData={setData} />}
                {currentStep === 4 && <Step4Goals data={data} setData={setData} />}
                {currentStep === 5 && <Step5Availability data={data} setData={setData} />}
                {currentStep === 6 && <Step6Review data={data} onEdit={jumpToStep} />}
              </motion.div>
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-5 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  <AlertIcon className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Fixed nav footer */}
        <div className="shrink-0 border-t border-white/[0.06] bg-[#08080a] px-5 py-4 sm:px-8">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white/20 hover:text-white disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:text-white/70"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>

            {currentStep < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="group inline-flex items-center gap-2 rounded-lg bg-green-500 px-7 py-3 text-sm font-semibold text-black shadow-[0_0_28px_rgba(34,197,94,0.28)] transition hover:bg-green-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none disabled:hover:bg-green-500"
              >
                Continue
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !validateStep(5)}
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-7 py-3 text-sm font-semibold text-black shadow-[0_0_28px_rgba(34,197,94,0.28)] transition hover:bg-green-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:bg-green-500"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Creating…
                  </>
                ) : (
                  <>
                    Create Profile
                    <CheckIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Shared step-header ─────────────────────────────────────────────── */

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7">
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mt-1.5 text-sm text-white/50">{subtitle}</p>
    </div>
  );
}

// A small field label in the design-system style.
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
      {children}
    </label>
  );
}

// Shared class for text/number inputs — the card surface the user preferred.
const inputBase =
  "w-full rounded-lg border border-white/10 bg-[#141519] text-white placeholder-white/30 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

// ============================================================================
// STEP 1: Personal Information
// ============================================================================

function Step1Personal({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  const age = data.dateOfBirth ? calculateAge(data.dateOfBirth) : null;
  const isValidAge = data.dateOfBirth ? isValidYouthAge(data.dateOfBirth) : true;

  return (
    <div>
      <StepHeader
        title="Let's start with the basics"
        subtitle="Tell us who you are so we can personalise your journey."
      />

      <div className="space-y-5">
        {/* Full Name */}
        <div>
          <FieldLabel>Full Name</FieldLabel>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
              placeholder="Enter your full name"
              className={`${inputBase} py-3.5 pl-11 pr-4`}
              required
            />
          </div>
        </div>

        {/* Date of Birth & Gender Row */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Date of Birth */}
          <div>
            <FieldLabel>Date of Birth</FieldLabel>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
              <input
                type="date"
                value={data.dateOfBirth}
                onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
                className={`${inputBase} py-3.5 pl-11 pr-4 [color-scheme:dark]`}
                required
              />
            </div>
            {age !== null && (
              <p className={`mt-1.5 text-xs ${isValidAge ? "text-white/40" : "text-red-400"}`}>
                {isValidAge ? `${age} years old` : `Age must be 10–18 (currently ${age})`}
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <FieldLabel>Gender</FieldLabel>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
              <select
                value={data.gender}
                onChange={(e) => setData({ ...data, gender: e.target.value as Gender })}
                className={`${inputBase} appearance-none py-3.5 pl-11 pr-10`}
                required
              >
                <option value="" className="bg-[#0d0d0d]">
                  Select gender
                </option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#0d0d0d]">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 2: Football Details
// ============================================================================

function Step2Football({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  return (
    <div>
      <StepHeader
        title="Your game on the pitch"
        subtitle="Where you play shapes the drills and benchmarks we pick for you."
      />

      <div className="space-y-6">
        {/* Position */}
        <div>
          <FieldLabel>Preferred Position</FieldLabel>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {ROLES.map((role) => {
              const isSelected = data.position === role.slug;
              const Icon = POSITION_ICONS[role.slug];
              const num = POSITION_NUMBERS[role.slug];
              return (
                <button
                  key={role.slug}
                  type="button"
                  onClick={() => setData({ ...data, position: role.slug })}
                  className={`relative flex flex-col items-center gap-2.5 rounded-xl border p-4 transition ${
                    isSelected
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-white/10 bg-[#141519] hover:border-teal-500/40 hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`flex h-11 items-center justify-center transition ${
                      isSelected ? "text-teal-300" : "text-white/60"
                    }`}
                  >
                    {num ? (
                      <span className="text-[28px] font-black leading-none tracking-tight">{num}</span>
                    ) : (
                      Icon && <Icon className="h-8 w-8" />
                    )}
                  </span>
                  <span
                    className={`text-center text-[11px] font-medium leading-tight ${
                      isSelected ? "text-teal-200" : "text-white/60"
                    }`}
                  >
                    {role.label.replace(/\s*\(.*\)/, "")}
                  </span>
                  {isSelected && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500">
                      <CheckIcon className="h-2.5 w-2.5 text-black" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dominant Foot & Years Playing */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Dominant Foot */}
          <div>
            <FieldLabel>Dominant Foot</FieldLabel>
            <div className="grid grid-cols-3 gap-2.5">
              {DOMINANT_FOOT_OPTIONS.map((option) => {
                const isSelected = data.dominantFoot === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setData({ ...data, dominantFoot: option.value })}
                    className={`rounded-xl border p-4 text-center text-sm font-semibold transition ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/10 text-teal-200"
                        : "border-white/10 bg-[#141519] text-white/70 hover:border-white/20"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Years Playing */}
          <div>
            <FieldLabel>Years of Playing</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="20"
                value={data.yearsPlaying}
                onChange={(e) =>
                  setData({ ...data, yearsPlaying: parseInt(e.target.value) || 0 })
                }
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full accent-teal-500"
                style={{
                  background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${
                    (data.yearsPlaying / 20) * 100
                  }%, rgba(255,255,255,0.08) ${
                    (data.yearsPlaying / 20) * 100
                  }%, rgba(255,255,255,0.08) 100%)`,
                }}
              />
              <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10">
                <span className="text-lg font-bold text-teal-300">{data.yearsPlaying}</span>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-white/35">
              <span>Just started</span>
              <span>20+ years</span>
            </div>
          </div>
        </div>

        {/* Current Club */}
        <div>
          <FieldLabel>
            Current Club <span className="font-normal normal-case text-white/30">(optional)</span>
          </FieldLabel>
          <div className="relative">
            <ShieldIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              value={data.currentClub}
              onChange={(e) => setData({ ...data, currentClub: e.target.value })}
              placeholder="Enter your club name"
              className={`${inputBase} py-3.5 pl-11 pr-4`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 3: Physical Details
// ============================================================================

function Step3Physical({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  return (
    <div>
      <StepHeader
        title="Your physical profile"
        subtitle="Optional measurements plus how match-ready you feel right now."
      />

      <div className="space-y-6">
        {/* Height & Weight */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <FieldLabel>
              Height <span className="font-normal normal-case text-white/30">(cm)</span>
            </FieldLabel>
            <input
              type="number"
              min="100"
              max="220"
              value={data.height}
              onChange={(e) => setData({ ...data, height: e.target.value })}
              placeholder="e.g. 165"
              className={`${inputBase} px-4 py-3.5`}
            />
          </div>
          <div>
            <FieldLabel>
              Weight <span className="font-normal normal-case text-white/30">(kg)</span>
            </FieldLabel>
            <input
              type="number"
              min="30"
              max="150"
              value={data.weight}
              onChange={(e) => setData({ ...data, weight: e.target.value })}
              placeholder="e.g. 55"
              className={`${inputBase} px-4 py-3.5`}
            />
          </div>
        </div>

        {/* Fitness Level */}
        <div>
          <FieldLabel>Fitness Level</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-3">
            {FITNESS_LEVELS.map((level) => {
              const isSelected = data.fitnessLevel === level.value;
              const Icon = FITNESS_ICONS[level.value] ?? SparkleIcon;
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setData({ ...data, fitnessLevel: level.value })}
                  className={`relative flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition ${
                    isSelected
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-white/10 bg-[#141519] hover:border-teal-500/40 hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border transition ${
                      isSelected
                        ? "border-teal-400/40 bg-teal-500/15 text-teal-300"
                        : "border-white/10 bg-white/[0.03] text-white/45"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div
                    className={`text-sm font-semibold ${
                      isSelected ? "text-teal-200" : "text-white/80"
                    }`}
                  >
                    {level.label}
                  </div>
                  <div className="text-xs leading-relaxed text-white/40">{level.description}</div>
                  {isSelected && (
                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
                      <CheckIcon className="h-3 w-3 text-black" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 4: Goals
// ============================================================================

function Step4Goals({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  const toggleGoal = (goalId: string) => {
    setData({
      ...data,
      goals: data.goals.includes(goalId)
        ? data.goals.filter((g) => g !== goalId)
        : [...data.goals, goalId],
    });
  };

  const addCustomGoal = () => {
    if (data.customGoal.trim() && !data.goals.includes(data.customGoal.trim())) {
      setData({
        ...data,
        goals: [...data.goals, data.customGoal.trim()],
        customGoal: "",
      });
    }
  };

  return (
    <div>
      <StepHeader
        title="What are you chasing?"
        subtitle="Pick every goal that matters — we'll shape your plan around them."
      />

      <div className="space-y-5">
        {/* Predefined Goals */}
        <div className="grid gap-3 sm:grid-cols-2">
          {PREDEFINED_GOALS.map((goal) => {
            const isSelected = data.goals.includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoal(goal.id)}
                className={`group relative overflow-hidden rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-white/10 bg-[#141519] hover:border-white/20"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex-1">
                    <div
                      className={`text-sm font-semibold ${
                        isSelected ? "text-teal-200" : "text-white/90"
                      }`}
                    >
                      {goal.label}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-white/40">
                      {goal.description}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500">
                      <CheckIcon className="h-3 w-3 text-black" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Goal Input */}
        <div>
          <FieldLabel>Add Your Own Goal</FieldLabel>
          <div className="flex gap-2.5">
            <input
              type="text"
              value={data.customGoal}
              onChange={(e) => setData({ ...data, customGoal: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomGoal();
                }
              }}
              placeholder="e.g. Play in a higher division"
              className={`${inputBase} flex-1 px-4 py-3.5`}
            />
            <button
              type="button"
              onClick={addCustomGoal}
              disabled={!data.customGoal.trim()}
              className="shrink-0 rounded-xl border border-teal-500/40 bg-teal-500/10 px-6 py-3.5 text-sm font-semibold text-teal-300 transition hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-teal-500/10"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 5: Availability
// ============================================================================

function Step5Availability({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}) {
  const toggleDay = (day: TrainingDay) => {
    setData({
      ...data,
      trainingDays: data.trainingDays.includes(day)
        ? data.trainingDays.filter((d) => d !== day)
        : [...data.trainingDays, day],
    });
  };

  const handleDurationChange = (value: number) => {
    setData({ ...data, sessionDuration: value, customDuration: "" });
  };

  return (
    <div>
      <StepHeader
        title="When can you train?"
        subtitle="We'll build your weekly plan around the time you actually have."
      />

      <div className="space-y-6">
        {/* Training Days */}
        <div>
          <FieldLabel>Training Days</FieldLabel>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {TRAINING_DAYS_OPTIONS.map((day) => {
              const isSelected = data.trainingDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`rounded-lg border py-3.5 text-center text-xs font-bold transition ${
                    isSelected
                      ? "border-teal-500 bg-teal-500 text-black"
                      : "border-white/10 bg-[#141519] text-white/50 hover:border-white/20 hover:text-white/70"
                  }`}
                >
                  {day.shortLabel.slice(0, 3)}
                </button>
              );
            })}
          </div>
          {data.trainingDays.length > 0 && (
            <p className="mt-2 text-xs text-white/40">
              {data.trainingDays.length} day{data.trainingDays.length !== 1 ? "s" : ""} per week
            </p>
          )}
        </div>

        {/* Training Duration */}
        <div>
          <FieldLabel>Session Duration</FieldLabel>
          <div className="grid grid-cols-4 gap-2.5">
            {SESSION_DURATION_PRESETS.map((preset) => {
              const isSelected = data.sessionDuration === preset.value && !data.customDuration;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleDurationChange(preset.value)}
                  className={`rounded-xl border py-3.5 text-center text-sm font-semibold transition ${
                    isSelected
                      ? "border-teal-500 bg-teal-500/10 text-teal-200"
                      : "border-white/10 bg-[#141519] text-white/60 hover:border-white/20 hover:text-white/80"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Training Time */}
        <div>
          <FieldLabel>Preferred Time</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-3">
            {PREFERRED_TIME_OPTIONS.map((time) => {
              const isSelected = data.preferredTime === time.value;
              const Icon = TIME_ICONS[time.value] ?? SunIcon;
              return (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => setData({ ...data, preferredTime: time.value })}
                  className={`relative flex flex-col items-center gap-2.5 rounded-xl border p-5 text-center transition ${
                    isSelected
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-white/10 bg-[#141519] hover:border-white/20"
                  }`}
                >
                  <Icon className={`h-7 w-7 ${isSelected ? "text-teal-300" : "text-white/45"}`} />
                  <div
                    className={`text-sm font-semibold ${
                      isSelected ? "text-teal-200" : "text-white/80"
                    }`}
                  >
                    {time.label}
                  </div>
                  <div className="text-[11px] text-white/40">{time.timeRange}</div>
                  {isSelected && (
                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
                      <CheckIcon className="h-3 w-3 text-black" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 6: Review & Create Profile
// ============================================================================

function Step6Review({
  data,
  onEdit,
}: {
  data: OnboardingData;
  onEdit: (step: number) => void;
}) {
  const age = data.dateOfBirth ? calculateAge(data.dateOfBirth) : null;
  const positionLabel = ROLES.find((r) => r.slug === data.position)?.label;
  const genderLabel = GENDER_OPTIONS.find((g) => g.value === data.gender)?.label;
  const footLabel = DOMINANT_FOOT_OPTIONS.find((f) => f.value === data.dominantFoot)?.label;
  const fitnessLabel = FITNESS_LEVELS.find((f) => f.value === data.fitnessLevel)?.label;
  const timeLabel = PREFERRED_TIME_OPTIONS.find((t) => t.value === data.preferredTime)?.label;

  const finalDuration = data.sessionDuration || parseInt(data.customDuration);

  return (
    <div>
      <StepHeader
        title="Review your profile"
        subtitle="Everything look good? Edit any section before we build your plan."
      />

      <div className="space-y-4">
        {/* Personal Information */}
        <ReviewSection title="Personal Information" onEdit={() => onEdit(1)}>
          <ReviewItem label="Full Name" value={data.fullName} />
          <ReviewItem label="Date of Birth" value={`${data.dateOfBirth} · ${age} yrs`} />
          <ReviewItem label="Gender" value={genderLabel} />
        </ReviewSection>

        {/* Football Details */}
        <ReviewSection title="Football Details" onEdit={() => onEdit(2)}>
          <ReviewItem label="Position" value={positionLabel} />
          <ReviewItem label="Dominant Foot" value={footLabel} />
          <ReviewItem label="Years Playing" value={`${data.yearsPlaying} years`} />
          <ReviewItem label="Current Club" value={data.currentClub || "Not specified"} />
        </ReviewSection>

        {/* Physical Details */}
        <ReviewSection title="Physical Details" onEdit={() => onEdit(3)}>
          <ReviewItem label="Height" value={data.height ? `${data.height} cm` : "Not specified"} />
          <ReviewItem label="Weight" value={data.weight ? `${data.weight} kg` : "Not specified"} />
          <ReviewItem label="Fitness Level" value={fitnessLabel} />
        </ReviewSection>

        {/* Goals */}
        <ReviewSection title="Goals" onEdit={() => onEdit(4)}>
          <div className="flex flex-wrap gap-2">
            {data.goals.map((goal) => {
              const label = PREDEFINED_GOALS.find((g) => g.id === goal)?.label || goal;
              return (
                <span
                  key={goal}
                  className="inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs text-teal-200"
                >
                  {label}
                </span>
              );
            })}
          </div>
        </ReviewSection>

        {/* Availability */}
        <ReviewSection title="Availability" onEdit={() => onEdit(5)}>
          <ReviewItem
            label="Training Days"
            value={data.trainingDays
              .map((d) => TRAINING_DAYS_OPTIONS.find((opt) => opt.value === d)?.label)
              .join(", ")}
          />
          <ReviewItem label="Preferred Time" value={timeLabel} />
          <ReviewItem label="Session Duration" value={`${finalDuration} minutes`} />
        </ReviewSection>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-teal-400 transition hover:text-teal-300"
        >
          Edit
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-white/45">{label}</span>
      <span className="text-right font-medium text-white/85">{value}</span>
    </div>
  );
}
