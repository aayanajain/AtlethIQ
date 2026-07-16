"use client";
// app/(protected)/player/profile/page.tsx
//
// Profile edit page with tabbed interface for updating player information.
// Unlike getting-started (which INSERTs), this page UPDATES existing profile.
// Does NOT change onboardingCompleted flag (always stays true).
//
// Tabs:
// 1. Personal - Full name, DOB, gender
// 2. Football - Position, foot, years, club
// 3. Physical - Height, weight, fitness level
// 4. Goals - Manage goals array
// 5. Availability - Days, time, duration

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
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
import { Card, btnPrimary } from "@/src/components/ui";

type TabId = "personal" | "football" | "physical" | "goals" | "availability";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "personal", label: "Personal", icon: "👤" },
  { id: "football", label: "Football", icon: "⚽" },
  { id: "physical", label: "Physical", icon: "💪" },
  { id: "goals", label: "Goals", icon: "🎯" },
  { id: "availability", label: "Availability", icon: "📅" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Player data
  const [player, setPlayer] = useState<Player | null>(null);

  // Form data (separate from player for edit state)
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "" as Gender | "",
    position: "" as Position | "",
    dominantFoot: "" as DominantFoot | "",
    yearsPlaying: 0,
    currentClub: "",
    height: "",
    weight: "",
    fitnessLevel: "" as FitnessLevel | "",
    goals: [] as string[],
    customGoal: "",
    trainingDays: [] as TrainingDay[],
    preferredTime: "" as PreferredTime | "",
    sessionDuration: 60,
    customDuration: "",
  });

  // Load existing player profile
  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from("players")
        .select("*")
        .maybeSingle();

      if (!data) {
        router.push("/player/getting-started");
        return;
      }

      const p = data as Player;
      setPlayer(p);

      // Populate form data
      setFormData({
        fullName: p.fullName || "",
        dateOfBirth: p.dateOfBirth || "",
        gender: p.gender || "",
        position: p.position || "",
        dominantFoot: p.dominantFoot || "",
        yearsPlaying: p.yearsPlaying || 0,
        currentClub: p.currentClub || "",
        height: p.height?.toString() || "",
        weight: p.weight?.toString() || "",
        fitnessLevel: p.fitnessLevel || "",
        goals: p.goals || [],
        customGoal: "",
        trainingDays: p.trainingDays || [],
        preferredTime: p.preferredTime || "",
        sessionDuration: p.sessionDuration || 60,
        customDuration: "",
      });

      setLoading(false);
    }
    loadProfile();
  }, [router]);

  // Save current tab's data
  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const finalDuration = formData.sessionDuration || parseInt(formData.customDuration);

      const updateData: Partial<Player> = {
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as Gender,
        position: formData.position as Position,
        dominantFoot: formData.dominantFoot as DominantFoot,
        yearsPlaying: formData.yearsPlaying,
        currentClub: formData.currentClub.trim() || undefined,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        fitnessLevel: formData.fitnessLevel as FitnessLevel,
        goals: formData.goals,
        trainingDays: formData.trainingDays,
        preferredTime: formData.preferredTime as PreferredTime,
        sessionDuration: finalDuration,
      };

      const { error: updateError } = await supabase
        .from("players")
        .update(updateData)
        .eq("id", player!.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/50">Loading profile...</p>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/player"
            className="inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-white">Edit Profile</h1>
          <p className="mt-1 text-white/60">Update your player information</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError(null);
                setSuccess(false);
              }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-teal-500/10 text-teal-300 border border-teal-500/30"
                  : "bg-white/[0.04] text-white/60 border border-white/10 hover:border-white/20"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <Card className="p-6 sm:p-8">
          {activeTab === "personal" && (
            <PersonalTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "football" && (
            <FootballTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "physical" && (
            <PhysicalTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "goals" && (
            <GoalsTab formData={formData} setFormData={setFormData} />
          )}
          {activeTab === "availability" && (
            <AvailabilityTab formData={formData} setFormData={setFormData} />
          )}

          {/* Messages */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              ✓ Changes saved successfully
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={btnPrimary + " disabled:opacity-50"}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 1: Personal Information
// ============================================================================

interface TabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

function PersonalTab({ formData, setFormData }: TabProps) {
  const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : null;
  const isValidAge = formData.dateOfBirth ? isValidYouthAge(formData.dateOfBirth) : true;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Personal Information</h2>
        <p className="mt-1 text-sm text-white/60">Update your basic details</p>
      </div>

      {/* Full Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-teal-500"
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
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-teal-500"
          required
        />
        {age !== null && (
          <p className={`mt-1 text-sm ${isValidAge ? "text-white/50" : "text-red-400"}`}>
            Age: {age} years old
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
              onClick={() => setFormData({ ...formData, gender: option.value })}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                formData.gender === option.value
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
// TAB 2: Football Details
// ============================================================================

function FootballTab({ formData, setFormData }: TabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Football Details</h2>
        <p className="mt-1 text-sm text-white/60">Update your playing information</p>
      </div>

      {/* Position */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Position <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLES.map((role) => (
            <button
              key={role.slug}
              type="button"
              onClick={() => setFormData({ ...formData, position: role.slug })}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                formData.position === role.slug
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
              onClick={() => setFormData({ ...formData, dominantFoot: option.value })}
              className={`rounded-lg border px-4 py-4 text-center transition ${
                formData.dominantFoot === option.value
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20"
              }`}
            >
              <div className="mb-1 text-xl">{option.icon}</div>
              <div className="font-medium">{option.label}</div>
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
          value={formData.yearsPlaying}
          onChange={(e) =>
            setFormData({ ...formData, yearsPlaying: parseInt(e.target.value) || 0 })
          }
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-teal-500"
        />
      </div>

      {/* Current Club */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Current Club <span className="text-white/40">(Optional)</span>
        </label>
        <input
          type="text"
          value={formData.currentClub}
          onChange={(e) => setFormData({ ...formData, currentClub: e.target.value })}
          placeholder="e.g. City Youth FC"
          className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500"
        />
      </div>
    </div>
  );
}

// ============================================================================
// TAB 3: Physical Details
// ============================================================================

function PhysicalTab({ formData, setFormData }: TabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Physical Details</h2>
        <p className="mt-1 text-sm text-white/60">Update your physical profile</p>
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
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
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
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
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
              onClick={() => setFormData({ ...formData, fitnessLevel: level.value })}
              className={`rounded-lg border px-4 py-4 text-center transition ${
                formData.fitnessLevel === level.value
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
// TAB 4: Goals
// ============================================================================

function GoalsTab({ formData, setFormData }: TabProps) {
  const toggleGoal = (goalId: string) => {
    setFormData({
      ...formData,
      goals: formData.goals.includes(goalId)
        ? formData.goals.filter((g: string) => g !== goalId)
        : [...formData.goals, goalId],
    });
  };

  const addCustomGoal = () => {
    if (formData.customGoal.trim() && !formData.goals.includes(formData.customGoal.trim())) {
      setFormData({
        ...formData,
        goals: [...formData.goals, formData.customGoal.trim()],
        customGoal: "",
      });
    }
  };

  const removeGoal = (goal: string) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((g: string) => g !== goal),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Your Goals</h2>
        <p className="mt-1 text-sm text-white/60">Update what you want to achieve</p>
      </div>

      {/* Predefined Goals */}
      <div className="grid gap-3 sm:grid-cols-2">
        {PREDEFINED_GOALS.map((goal) => {
          const isSelected = formData.goals.includes(goal.id);
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
          Add Custom Goal
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.customGoal}
            onChange={(e) => setFormData({ ...formData, customGoal: e.target.value })}
            onKeyPress={(e) => e.key === "Enter" && addCustomGoal()}
            placeholder="e.g. Play in a higher division"
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500"
          />
          <button
            type="button"
            onClick={addCustomGoal}
            disabled={!formData.customGoal.trim()}
            className="rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-black transition hover:bg-green-500 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected Goals */}
      {formData.goals.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Selected Goals ({formData.goals.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {formData.goals.map((goal: string) => {
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
// TAB 5: Availability
// ============================================================================

function AvailabilityTab({ formData, setFormData }: TabProps) {
  const toggleDay = (day: TrainingDay) => {
    setFormData({
      ...formData,
      trainingDays: formData.trainingDays.includes(day)
        ? formData.trainingDays.filter((d: TrainingDay) => d !== day)
        : [...formData.trainingDays, day],
    });
  };

  const handleDurationChange = (value: number) => {
    setFormData({ ...formData, sessionDuration: value, customDuration: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Availability</h2>
        <p className="mt-1 text-sm text-white/60">Update your training schedule</p>
      </div>

      {/* Training Days */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">
          Training Days <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-7 gap-2">
          {TRAINING_DAYS_OPTIONS.map((day) => {
            const isSelected = formData.trainingDays.includes(day.value);
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
          Selected: {formData.trainingDays.length} day{formData.trainingDays.length !== 1 ? "s" : ""}
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
              onClick={() => setFormData({ ...formData, preferredTime: time.value })}
              className={`rounded-lg border px-4 py-4 text-center transition ${
                formData.preferredTime === time.value
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
                formData.sessionDuration === preset.value && !formData.customDuration
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
              value={formData.customDuration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customDuration: e.target.value,
                  sessionDuration: 0,
                })
              }
              placeholder="Custom"
              className={`h-full w-full rounded-lg border px-3 text-center text-sm outline-none ${
                formData.customDuration
                  ? "border-teal-500 bg-teal-500/10 text-teal-300"
                  : "border-white/10 bg-white/[0.04] text-white/70 placeholder-white/40"
              } focus:border-teal-500`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
