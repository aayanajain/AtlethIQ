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
// DEV MODE: Set DEV_MODE = true to always show this page for testing,
// bypassing the onboardingCompleted check.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card, btnPrimary, btnGhost } from "@/src/components/ui";

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
        return !!(
          data.position &&
          data.dominantFoot &&
          data.yearsPlaying >= 0
        );
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
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  function jumpToStep(step: number) {
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
      const { data: { user } } = await supabase.auth.getUser();
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
      const { error: insertError } = await supabase
        .from("players")
        .upsert(playerData);

      if (insertError) throw insertError;

      router.push("/player");
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header with Logo */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500">
              <span className="text-sm font-bold text-black">A</span>
            </div>
            <span className="text-lg font-bold text-white">AthletIQ</span>
          </div>
          <div className="text-sm text-white/50">
            Step {currentStep} of {TOTAL_STEPS}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-0">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full transition-all ${
                    step < currentStep
                      ? "bg-green-500"
                      : step === currentStep
                      ? "bg-green-500 ring-4 ring-green-500/20"
                      : "bg-white/20"
                  }`}
                />
                {index < TOTAL_STEPS - 1 && (
                  <div
                    className={`h-[2px] transition-all ${
                      step < currentStep ? "bg-green-500" : "bg-white/10"
                    }`}
                    style={{ width: 'clamp(2rem, 8vw, 5rem)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6 sm:p-8">
          {currentStep === 1 && (
            <Step1Personal data={data} setData={setData} />
          )}
          {currentStep === 2 && (
            <Step2Football data={data} setData={setData} />
          )}
          {currentStep === 3 && (
            <Step3Physical data={data} setData={setData} />
          )}
          {currentStep === 4 && (
            <Step4Goals data={data} setData={setData} />
          )}
          {currentStep === 5 && (
            <Step5Availability data={data} setData={setData} />
          )}
          {currentStep === 6 && (
            <Step6Review data={data} onEdit={jumpToStep} />
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`rounded-lg border border-white/10 bg-[#0f1621] px-6 py-3 font-medium text-white/70 transition hover:border-white/20 hover:text-white disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-white/70`}
            >
              Back
            </button>

            {currentStep < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className={`flex items-center gap-2 rounded-lg bg-teal-500 px-8 py-3 font-semibold text-black transition hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500`}
              >
                Next
                <span>→</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !validateStep(5)}
                className={`flex items-center gap-2 rounded-lg bg-teal-500 px-8 py-3 font-semibold text-black transition hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500`}
              >
                {submitting ? "Creating..." : "Create Profile"}
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Personal Information</h2>
        <p className="mt-1 text-sm text-white/50">Let's start with the basics.</p>
      </div>

      {/* Full Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Full Name
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">👤</span>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => setData({ ...data, fullName: e.target.value })}
            placeholder="Enter your full name"
            className="w-full rounded-lg border border-white/10 bg-[#0f1621] py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            required
          />
        </div>
      </div>

      {/* Date of Birth & Gender Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Date of Birth */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">
            Date of Birth
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">📅</span>
            <input
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
              placeholder="DD / MM / YYYY"
              className="w-full rounded-lg border border-white/10 bg-[#0f1621] py-3 pl-10 pr-4 text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              required
            />
          </div>
          {age !== null && (
            <p className={`mt-1.5 text-xs ${isValidAge ? "text-white/40" : "text-red-400"}`}>
              {isValidAge
                ? `${age} years old`
                : `Age must be 10-18 (currently ${age})`}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">
            Gender
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">⚧</span>
            <select
              value={data.gender}
              onChange={(e) => setData({ ...data, gender: e.target.value as Gender })}
              className="w-full appearance-none rounded-lg border border-white/10 bg-[#0f1621] py-3 pl-10 pr-10 text-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              required
            >
              <option value="" className="bg-[#0f1621] text-white/50">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#0f1621] text-white">
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">▼</span>
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
  // Icon components matching the reference design
  const PositionIcon = ({ position, isSelected }: { position: string; isSelected: boolean }) => {
    const iconClass = `${isSelected ? 'text-teal-400' : 'text-teal-400/60'}`;
    
    switch(position) {
      case 'goalkeeper':
        return (
          <svg className={`h-7 w-7 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3H8C6.5 3 6 3.5 6 5v14c0 1.5.5 2 2 2h8c1.5 0 2-.5 2-2V5c0-1.5-.5-2-2-2z"/>
            <line x1="6" y1="8" x2="18" y2="8"/>
            <line x1="6" y1="13" x2="18" y2="13"/>
            <line x1="6" y1="18" x2="18" y2="18"/>
          </svg>
        );
      case 'centre-back':
        return (
          <svg className={`h-7 w-7 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        );
      case 'full-back':
        return (
          <svg className={`h-7 w-7 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M8 10l4 4 4-4"/>
          </svg>
        );
      case 'defensive-mid':
        return (
          <svg className={`h-7 w-7 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
            <path d="M5.64 5.64l2.83 2.83m7.07 7.07l2.83 2.83M5.64 18.36l2.83-2.83m7.07-7.07l2.83-2.83"/>
          </svg>
        );
      case 'central-mid':
        return (
          <svg className={`h-7 w-7 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        );
      case 'attacking-mid':
        return (
          <svg className={`h-7 w-7 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="3"/>
            <path d="M12 11v11"/>
            <path d="M8 15l4 4 4-4"/>
          </svg>
        );
      case 'winger':
        return (
          <svg className={`h-7 w-7 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-5 3c-.4.2-.5.7-.4 1.1l.3.5c.2.4.6.6 1 .5L13 15l3.5 3.5c1.5 1.5 3.5 2 4.5 1.5.5-1 0-3-1.5-4.5L16 13l3.2 1.8z"/>
          </svg>
        );
      case 'striker':
        return (
          <svg className={`h-7 w-7 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        );
      default:
        return <span className="text-2xl">⚽</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Football Details</h2>
        <p className="mt-1 text-sm text-white/50">Tell us more about your game.</p>
      </div>

      {/* Position */}
      <div>
        <label className="mb-3 block text-sm font-medium text-white/70">
          Preferred Position
        </label>
        <div className="grid grid-cols-4 gap-3">
          {ROLES.map((role) => {
            const isSelected = data.position === role.slug;
            return (
              <button
                key={role.slug}
                type="button"
                onClick={() => setData({ ...data, position: role.slug })}
                className={`relative flex flex-col items-center gap-3 rounded-lg border p-4 transition ${
                  isSelected
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-white/10 bg-[#0f1621] hover:border-teal-500/50"
                }`}
              >
                <PositionIcon position={role.slug} isSelected={isSelected} />
                <span className={`text-xs font-medium text-center ${
                  isSelected ? "text-teal-300" : "text-white/70"
                }`}>
                  {role.label}
                </span>
                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
                    <svg className="h-3 w-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dominant Foot & Years Playing */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Dominant Foot */}
        <div>
          <label className="mb-3 block text-sm font-medium text-white/70">
            Dominant Foot
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DOMINANT_FOOT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setData({ ...data, dominantFoot: option.value })}
                className={`rounded-xl border p-4 text-center transition ${
                  data.dominantFoot === option.value
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-white/10 bg-[#0f1621] hover:border-white/20"
                }`}
              >
                <div className={`text-sm font-semibold ${
                  data.dominantFoot === option.value ? "text-teal-300" : "text-white/70"
                }`}>
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Years Playing */}
        <div>
          <label className="mb-3 block text-sm font-medium text-white/70">
            Years of Playing
          </label>
          <div className="relative flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="20"
              value={data.yearsPlaying}
              onChange={(e) =>
                setData({ ...data, yearsPlaying: parseInt(e.target.value) || 0 })
              }
              className="flex-1 accent-teal-500"
              style={{
                background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${(data.yearsPlaying / 20) * 100}%, rgba(255,255,255,0.1) ${(data.yearsPlaying / 20) * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <div className="flex h-12 w-16 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10">
              <span className="text-lg font-bold text-teal-300">{data.yearsPlaying}</span>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/40">
            <span>0 years</span>
            <span>20+ years</span>
          </div>
        </div>
      </div>

      {/* Current Club */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Current Club <span className="text-white/40">(Optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">⚽</span>
          <input
            type="text"
            value={data.currentClub}
            onChange={(e) => setData({ ...data, currentClub: e.target.value })}
            placeholder="Enter your club name"
            className="w-full rounded-lg border border-white/10 bg-[#0f1621] py-3 pl-10 pr-4 text-white placeholder-white/30 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
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
  // Fitness level icon components
  const FitnessIcon = ({ level, isSelected }: { level: string; isSelected: boolean }) => {
    const iconClass = `${isSelected ? 'text-teal-400' : 'text-teal-400/60'}`;
    
    switch(level) {
      case 'beginner':
        return (
          <svg className={`h-8 w-8 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6M7 18v-4M11 18v-2"/>
          </svg>
        );
      case 'intermediate':
        return (
          <svg className={`h-8 w-8 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-8M7 18v-6M11 18v-4M15 18v-2"/>
          </svg>
        );
      case 'advanced':
        return (
          <svg className={`h-8 w-8 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        );
      case 'professional':
        return (
          <svg className={`h-8 w-8 ${iconClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        );
      default:
        return <span className="text-2xl">📊</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Physical Details</h2>
        <p className="mt-1 text-sm text-white/50">Help us understand your physical profile</p>
      </div>

      {/* Height & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">
            Height <span className="text-white/40">(cm)</span>
          </label>
          <input
            type="number"
            min="100"
            max="220"
            value={data.height}
            onChange={(e) => setData({ ...data, height: e.target.value })}
            placeholder="e.g. 165"
            className="w-full rounded-lg border border-white/10 bg-[#0f1621] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">
            Weight <span className="text-white/40">(kg)</span>
          </label>
          <input
            type="number"
            min="30"
            max="150"
            value={data.weight}
            onChange={(e) => setData({ ...data, weight: e.target.value })}
            placeholder="e.g. 55"
            className="w-full rounded-lg border border-white/10 bg-[#0f1621] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Fitness Level */}
      <div>
        <label className="mb-3 block text-sm font-medium text-white/70">
          Fitness Level
        </label>
        <div className="grid gap-3 sm:grid-cols-4">
          {FITNESS_LEVELS.map((level) => {
            const isSelected = data.fitnessLevel === level.value;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => setData({ ...data, fitnessLevel: level.value })}
                className={`relative flex flex-col items-center gap-3 rounded-lg border p-4 text-center transition ${
                  isSelected
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-white/10 bg-[#0f1621] hover:border-teal-500/50"
                }`}
              >
                <FitnessIcon level={level.value} isSelected={isSelected} />
                <div className={`font-semibold text-sm ${
                  isSelected ? "text-teal-300" : "text-white/80"
                }`}>
                  {level.label}
                </div>
                <div className="text-xs text-white/40">{level.description}</div>
                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
                    <svg className="h-3 w-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
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

  const removeGoal = (goal: string) => {
    setData({
      ...data,
      goals: data.goals.filter((g) => g !== goal),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Your Goals</h2>
        <p className="mt-1 text-sm text-white/50">
          What do you want to achieve? (Select all that apply)
        </p>
      </div>

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
                  : "border-white/10 bg-[#0f1621] hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                  isSelected ? "bg-teal-500/20" : "bg-[#1a2332]"
                }`}>
                  <span className="text-xl">{goal.icon}</span>
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${isSelected ? "text-teal-300" : "text-white/90"}`}>
                    {goal.label}
                  </div>
                  <div className="mt-1 text-xs text-white/40">{goal.description}</div>
                </div>
                {isSelected && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500">
                    <span className="text-xs text-black">✓</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Goal Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Add Your Own Goal
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={data.customGoal}
            onChange={(e) => setData({ ...data, customGoal: e.target.value })}
            onKeyPress={(e) => e.key === "Enter" && addCustomGoal()}
            placeholder="e.g. Play in a higher division"
            className="flex-1 rounded-lg border border-white/10 bg-[#0f1621] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <button
            type="button"
            onClick={addCustomGoal}
            disabled={!data.customGoal.trim()}
            className={`shrink-0 rounded-lg bg-teal-500 px-6 py-3 font-medium text-black transition hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500`}
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected Goals Count */}
      {data.goals.length > 0 && (
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3 text-center">
          <span className="text-sm text-teal-300">
            ✓ {data.goals.length} goal{data.goals.length !== 1 ? "s" : ""} selected
          </span>
        </div>
      )}
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Availability</h2>
        <p className="mt-1 text-sm text-white/50">When can you train?</p>
      </div>

      {/* Training Days */}
      <div>
        <label className="mb-3 block text-sm font-medium text-white/70">
          Training Days
        </label>
        <div className="grid grid-cols-7 gap-2">
          {TRAINING_DAYS_OPTIONS.map((day) => {
            const isSelected = data.trainingDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-lg border py-3 text-center text-xs font-semibold transition ${
                  isSelected
                    ? "border-teal-500 bg-teal-500 text-black"
                    : "border-white/10 bg-[#0f1621] text-white/50 hover:border-white/20"
                }`}
              >
                {day.shortLabel}
              </button>
            );
          })}
        </div>
        {data.trainingDays.length > 0 && (
          <p className="mt-2 text-xs text-white/40">
            {data.trainingDays.length} day{data.trainingDays.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Training Duration */}
      <div>
        <label className="mb-3 block text-sm font-medium text-white/70">
          Training Duration
        </label>
        <div className="grid grid-cols-5 gap-2">
          {SESSION_DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleDurationChange(preset.value)}
              className={`rounded-lg border py-3 text-center text-sm font-medium transition ${
                data.sessionDuration === preset.value && !data.customDuration
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-[#0f1621] text-white/70 hover:border-white/20"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Training Time */}
      <div>
        <label className="mb-3 block text-sm font-medium text-white/70">
          Preferred Training Time
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {PREFERRED_TIME_OPTIONS.map((time) => (
            <button
              key={time.value}
              type="button"
              onClick={() => setData({ ...data, preferredTime: time.value })}
              className={`rounded-xl border p-4 text-center transition ${
                data.preferredTime === time.value
                  ? "border-teal-500 bg-teal-500/10"
                  : "border-white/10 bg-[#0f1621] hover:border-white/20"
              }`}
            >
              <div className="mb-2 text-2xl">{time.icon}</div>
              <div className={`font-semibold ${
                data.preferredTime === time.value ? "text-teal-300" : "text-white/80"
              }`}>
                {time.label}
              </div>
              <div className="mt-1 text-xs text-white/40">{time.timeRange}</div>
            </button>
          ))}
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Review Your Profile</h2>
        <p className="mt-1 text-sm text-white/60">
          Everything look good? You can edit any section before creating your profile.
        </p>
      </div>

      {/* Personal Information */}
      <ReviewSection title="Personal Information" onEdit={() => onEdit(1)}>
        <ReviewItem label="Full Name" value={data.fullName} />
        <ReviewItem label="Date of Birth" value={`${data.dateOfBirth} (${age} years old)`} />
        <ReviewItem label="Gender" value={genderLabel} />
      </ReviewSection>

      {/* Football Details */}
      <ReviewSection title="Football Details" onEdit={() => onEdit(2)}>
        <ReviewItem label="Position" value={positionLabel} />
        <ReviewItem label="Dominant Foot" value={footLabel} />
        <ReviewItem label="Years Playing" value={`${data.yearsPlaying} years`} />
        <ReviewItem
          label="Current Club"
          value={data.currentClub || "Not specified"}
        />
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
            const predefined = PREDEFINED_GOALS.find((g) => g.id === goal);
            const label = predefined?.label || goal;
            return (
              <span
                key={goal}
                className="inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-sm text-teal-300"
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
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-white/90">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-teal-400 hover:text-teal-300"
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
    <div className="flex justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}
