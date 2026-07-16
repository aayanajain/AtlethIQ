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
    async function checkOnboarding() {
      // In dev mode, always allow access to getting-started
      if (DEV_MODE) {
        setLoading(false);
        return;
      }

      const { data: player } = await supabase
        .from("players")
        .select("onboardingCompleted")
        .maybeSingle();

      if (player?.onboardingCompleted) {
        router.replace("/player");
        return;
      }
      setLoading(false);
    }
    checkOnboarding();
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

      const { error: insertError } = await supabase
        .from("players")
        .insert(playerData);

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
    <div className="min-h-screen bg-[#050505] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Welcome to AthletIQ</h1>
          <p className="mt-2 text-white/60">Let&apos;s set up your profile</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-white/50">
            <span>Step {currentStep} of {TOTAL_STEPS}</span>
            <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
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
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={btnGhost + " disabled:opacity-30"}
            >
              ← Back
            </button>

            {currentStep < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className={btnPrimary + " disabled:opacity-50"}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !validateStep(5)}
                className={btnPrimary + " disabled:opacity-50"}
              >
                {submitting ? "Creating Profile..." : "Create My Profile 🚀"}
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
        <h2 className="text-xl font-bold text-white">Personal Information</h2>
        <p className="mt-1 text-sm text-white/60">Tell us a bit about yourself</p>
      </div>

      {/* Full Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => setData({ ...data, fullName: e.target.value })}
          placeholder="e.g. Sam Rivera"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500"
          required
        />
      </div>

      {/* Date of Birth */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Date of Birth <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-teal-500"
          required
        />
        {age !== null && (
          <p className={`mt-1 text-sm ${isValidAge ? "text-white/50" : "text-red-400"}`}>
            {isValidAge
              ? `Age: ${age} years old`
              : `Age must be between 10-18 years (currently ${age})`}
          </p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Gender <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setData({ ...data, gender: option.value })}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                data.gender === option.value
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20"
              }`}
            >
              <div className="mb-1 text-lg">{option.icon}</div>
              {option.label}
            </button>
          ))}
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Football Details</h2>
        <p className="mt-1 text-sm text-white/60">Your playing style and experience</p>
      </div>

      {/* Position */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Preferred Position <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((role) => (
            <button
              key={role.slug}
              type="button"
              onClick={() => setData({ ...data, position: role.slug })}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                data.position === role.slug
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dominant Foot */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Dominant Foot <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {DOMINANT_FOOT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setData({ ...data, dominantFoot: option.value })}
              className={`rounded-lg border px-4 py-4 text-center transition ${
                data.dominantFoot === option.value
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20"
              }`}
            >
              <div className="mb-1 text-xl">{option.icon}</div>
              <div className="font-medium">{option.label}</div>
              <div className="mt-1 text-xs text-white/40">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Years Playing */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Years of Playing <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          min="0"
          max="15"
          value={data.yearsPlaying}
          onChange={(e) =>
            setData({ ...data, yearsPlaying: parseInt(e.target.value) || 0 })
          }
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-teal-500"
          required
        />
        <p className="mt-1 text-xs text-white/40">How many years have you been playing football?</p>
      </div>

      {/* Current Club */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Current Club or Team <span className="text-white/40">(Optional)</span>
        </label>
        <input
          type="text"
          value={data.currentClub}
          onChange={(e) => setData({ ...data, currentClub: e.target.value })}
          placeholder="e.g. City Youth FC"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500"
        />
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Physical Details</h2>
        <p className="mt-1 text-sm text-white/60">Help us understand your physical profile</p>
      </div>

      {/* Height & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Height <span className="text-white/40">(cm)</span>
          </label>
          <input
            type="number"
            min="100"
            max="220"
            value={data.height}
            onChange={(e) => setData({ ...data, height: e.target.value })}
            placeholder="e.g. 165"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Weight <span className="text-white/40">(kg)</span>
          </label>
          <input
            type="number"
            min="30"
            max="150"
            value={data.weight}
            onChange={(e) => setData({ ...data, weight: e.target.value })}
            placeholder="e.g. 55"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Fitness Level */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Fitness Level <span className="text-red-400">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {FITNESS_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setData({ ...data, fitnessLevel: level.value })}
              className={`rounded-lg border px-4 py-4 text-center transition ${
                data.fitnessLevel === level.value
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20"
              }`}
            >
              <div className="mb-2 text-2xl">{level.icon}</div>
              <div className="font-semibold">{level.label}</div>
              <div className="mt-1 text-xs text-white/40">{level.description}</div>
            </button>
          ))}
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
        <h2 className="text-xl font-bold text-white">Your Goals</h2>
        <p className="mt-1 text-sm text-white/60">
          What do you want to achieve? <span className="text-red-400">*</span>
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
              className={`rounded-lg border px-4 py-4 text-left transition ${
                isSelected
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{goal.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{goal.label}</div>
                  <div className="mt-1 text-xs text-white/40">{goal.description}</div>
                </div>
                {isSelected && <span className="text-teal-400">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Goal Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Add Your Own Goal
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={data.customGoal}
            onChange={(e) => setData({ ...data, customGoal: e.target.value })}
            onKeyPress={(e) => e.key === "Enter" && addCustomGoal()}
            placeholder="e.g. Play in a higher division"
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500"
          />
          <button
            type="button"
            onClick={addCustomGoal}
            disabled={!data.customGoal.trim()}
            className={btnPrimary + " disabled:opacity-50"}
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected Goals */}
      {data.goals.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Selected Goals ({data.goals.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {data.goals.map((goal) => {
              const predefined = PREDEFINED_GOALS.find((g) => g.id === goal);
              const label = predefined?.label || goal;
              return (
                <span
                  key={goal}
                  className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-sm text-teal-300"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeGoal(goal)}
                    className="text-teal-400 hover:text-teal-300"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
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
        <h2 className="text-xl font-bold text-white">Availability</h2>
        <p className="mt-1 text-sm text-white/60">When can you train?</p>
      </div>

      {/* Training Days */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Training Days <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-7 gap-2">
          {TRAINING_DAYS_OPTIONS.map((day) => {
            const isSelected = data.trainingDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`rounded-lg border px-3 py-3 text-center text-xs font-semibold transition ${
                  isSelected
                    ? "border-teal-500 bg-teal-500/10 text-teal-300"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20"
                }`}
              >
                {day.shortLabel}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-white/40">
          Selected: {data.trainingDays.length} day{data.trainingDays.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Preferred Time */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Preferred Time <span className="text-red-400">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {PREFERRED_TIME_OPTIONS.map((time) => (
            <button
              key={time.value}
              type="button"
              onClick={() => setData({ ...data, preferredTime: time.value })}
              className={`rounded-lg border px-4 py-4 text-center transition ${
                data.preferredTime === time.value
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20"
              }`}
            >
              <div className="mb-1 text-xl">{time.icon}</div>
              <div className="font-semibold">{time.label}</div>
              <div className="mt-1 text-xs text-white/40">{time.timeRange}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Session Duration */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Session Duration <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {SESSION_DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleDurationChange(preset.value)}
              className={`rounded-lg border px-4 py-3 text-center text-sm font-medium transition ${
                data.sessionDuration === preset.value && !data.customDuration
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <div className="relative">
            <input
              type="number"
              min="15"
              max="300"
              value={data.customDuration}
              onChange={(e) =>
                setData({
                  ...data,
                  customDuration: e.target.value,
                  sessionDuration: 0,
                })
              }
              placeholder="Custom"
              className={`h-full w-full rounded-lg border px-3 text-center text-sm outline-none ${
                data.customDuration
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 placeholder-white/40"
              } focus:border-teal-500`}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-white/40">How long do your typical training sessions last?</p>
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
