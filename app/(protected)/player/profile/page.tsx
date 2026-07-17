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
  SunIcon,
} from "@/src/components/icons";

type TabId = "personal" | "football" | "physical" | "goals" | "availability";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "football", label: "Football", icon: ShieldIcon },
  { id: "physical", label: "Physical", icon: DumbbellIcon },
  { id: "goals", label: "Goals", icon: TargetIcon },
  { id: "availability", label: "Availability", icon: CalendarIcon },
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
      // Scope the query to the logged-in user. Without this we rely entirely on
      // RLS to pick the right row, and `.maybeSingle()` throws the moment more
      // than one row is visible (e.g. under the dev anon policy).
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("id", user.id)
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
    setError(null);
    setSuccess(false);

    const finalDuration = formData.sessionDuration || parseInt(formData.customDuration);

    // Validate required fields before writing (mirrors the getting-started
    // wizard). The edit page previously saved blindly, so a cleared field would
    // either persist an empty value or hit a DB CHECK constraint, and an empty
    // custom-duration box produced NaN → a NOT NULL int insert error.
    const validationError =
      !formData.fullName.trim()
        ? "Full name is required"
        : !formData.dateOfBirth || !isValidYouthAge(formData.dateOfBirth)
        ? "Enter a valid date of birth (age 10–18)"
        : !formData.gender
        ? "Please select a gender"
        : !formData.position
        ? "Please select a position"
        : !formData.dominantFoot
        ? "Please select your dominant foot"
        : !formData.fitnessLevel
        ? "Please select a fitness level"
        : formData.goals.length === 0
        ? "Please add at least one goal"
        : formData.trainingDays.length === 0
        ? "Please select at least one training day"
        : !formData.preferredTime
        ? "Please select a preferred time"
        : !finalDuration || Number.isNaN(finalDuration) || finalDuration <= 0
        ? "Please set a valid session duration"
        : null;

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
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

  // Calculate profile stats
  const age = player.dateOfBirth ? calculateAge(player.dateOfBirth) : null;
  const positionLabel = ROLES.find(r => r.slug === player.position)?.label || player.position;
  
  // Calculate profile completion percentage
  const totalFields = 13; // Core fields we track
  const completedFields = [
    player.fullName,
    player.dateOfBirth,
    player.gender,
    player.position,
    player.dominantFoot,
    player.yearsPlaying > 0,
    player.fitnessLevel,
    player.goals?.length > 0,
    player.trainingDays?.length > 0,
    player.preferredTime,
    player.sessionDuration > 0,
    player.height,
    player.weight,
  ].filter(Boolean).length;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  // Get user initials for avatar
  const initials = player.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Edit Profile</h1>
          <p className="mt-1 text-sm text-white/60">Update your player information</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column - Form Content */}
          <div className="lg:col-span-7 xl:col-span-8">
            {/* Tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto border-b border-white/[0.06] pb-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const colorMap = {
                  personal: { border: "border-sky-400", text: "text-sky-400", bg: "bg-sky-500/10", icon: "text-sky-400", iconInactive: "text-sky-500/50" },
                  football: { border: "border-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/10", icon: "text-emerald-400", iconInactive: "text-emerald-500/50" },
                  physical: { border: "border-purple-400", text: "text-purple-400", bg: "bg-purple-500/10", icon: "text-purple-400", iconInactive: "text-purple-500/50" },
                  goals: { border: "border-blue-400", text: "text-blue-400", bg: "bg-blue-500/10", icon: "text-blue-400", iconInactive: "text-blue-500/50" },
                  availability: { border: "border-cyan-400", text: "text-cyan-400", bg: "bg-cyan-500/10", icon: "text-cyan-400", iconInactive: "text-cyan-500/50" },
                };
                const colors = colorMap[tab.id];
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setError(null);
                      setSuccess(false);
                    }}
                    className={`group relative flex flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-t-lg px-5 py-3 text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? `${colors.bg} ${colors.text} border-b-2 ${colors.border}`
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.02]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-all duration-200 ${
                      activeTab === tab.id ? colors.icon : `${colors.iconInactive} group-hover:text-white/60`
                    }`} />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${colors.bg}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div 
              className="relative overflow-hidden rounded-2xl border p-6 shadow-xl transition-all duration-300 sm:p-8"
              style={{
                background: activeTab === "personal" 
                  ? "linear-gradient(to bottom right, rgba(20,184,166,0.08), rgba(8,8,10,0.98))"
                  : activeTab === "football"
                  ? "linear-gradient(to bottom right, rgba(16,185,129,0.08), rgba(8,8,10,0.98))"
                  : activeTab === "physical"
                  ? "linear-gradient(to bottom right, rgba(168,85,247,0.08), rgba(8,8,10,0.98))"
                  : activeTab === "goals"
                  ? "linear-gradient(to bottom right, rgba(59,130,246,0.08), rgba(8,8,10,0.98))"
                  : "linear-gradient(to bottom right, rgba(6,182,212,0.08), rgba(8,8,10,0.98))",
                borderColor: activeTab === "personal" 
                  ? "rgba(20,184,166,0.15)"
                  : activeTab === "football"
                  ? "rgba(16,185,129,0.15)"
                  : activeTab === "physical"
                  ? "rgba(168,85,247,0.15)"
                  : activeTab === "goals"
                  ? "rgba(59,130,246,0.15)"
                  : "rgba(6,182,212,0.15)",
              }}
            >
              <div className="animate-fadeIn">
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
              </div>

              {/* Messages */}
              {error && (
                <div className="mt-6 animate-slideIn flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 backdrop-blur-sm">
                  <AlertIcon className="h-5 w-5 flex-shrink-0 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-300">Error</p>
                    <p className="mt-0.5 text-xs text-red-300/80">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="mt-6 animate-slideIn flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 backdrop-blur-sm">
                  <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-300">Success</p>
                    <p className="mt-0.5 text-xs text-green-300/80">Your profile has been updated successfully</p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`group relative overflow-hidden rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 font-semibold text-black shadow-lg transition-all duration-200 hover:shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed ${
                    saving ? "animate-pulse" : "hover:scale-[1.02]"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {saving ? (
                      <>
                        <SparkleIcon className="h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Profile Card */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-8">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1419]">
                {/* Header Background with Gradient */}
                <div className="relative h-24 overflow-hidden bg-gradient-to-br from-teal-600/30 via-teal-800/20 to-[#0f1419]">
                  <div
                    className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40"
                    style={{
                      background: "radial-gradient(circle, rgba(20,184,166,0.5) 0%, transparent 70%)",
                      filter: "blur(35px)",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute -left-12 top-0 h-32 w-32 rounded-full opacity-20"
                    style={{
                      background: "radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)",
                      filter: "blur(35px)",
                    }}
                  />
                </div>

                {/* Avatar - overlapping header */}
                <div className="relative -mt-12 px-6">
                  <div className="relative inline-block">
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-[#0f1419] bg-gradient-to-br from-teal-600 to-teal-700 text-3xl font-bold text-white shadow-2xl">
                      {initials}
                    </div>
                    {/* Edit Badge */}
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#0f1419] bg-teal-500 shadow-lg">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="p-6 pt-4">
                  <h2 className="text-xl font-bold text-white">{player.fullName}</h2>
                  <p className="mt-1 text-sm font-medium text-teal-400">{positionLabel}</p>
                  
                  {/* Level Badge */}
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-yellow-600/40 bg-yellow-600/20 px-3 py-1 text-xs font-semibold text-yellow-400">
                    <SparkleIcon className="h-3 w-3" />
                    Level {Math.min(Math.floor(completionPercentage / 10) + 1, 12)}
                  </div>

                  {/* Stats Row */}
                  <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-white/10 bg-[#1a1f26] p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{player.goals?.length || 0}</p>
                      <p className="mt-1 text-xs text-white/40">Goals</p>
                    </div>
                    <div className="text-center border-x border-white/10">
                      <p className="text-2xl font-bold text-white">{player.trainingDays?.length || 0}</p>
                      <p className="mt-1 text-xs text-white/40">Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{age || '—'}</p>
                      <p className="mt-1 text-xs text-white/40">Age</p>
                    </div>
                  </div>

                  {/* Quote/Status */}
                  {player.currentFocus && (
                    <div className="mt-6 rounded-xl border border-teal-600/20 bg-teal-600/10 p-4">
                      <div className="flex items-start gap-3">
                        <TargetIcon className="h-5 w-5 flex-shrink-0 text-teal-400" />
                        <div>
                          <p className="text-xs font-medium text-teal-400">Current Focus</p>
                          <p className="mt-1 text-sm text-white/80">{player.currentFocus}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Strength */}
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-white/50">Profile Strength</span>
                      <span className="text-sm font-bold text-teal-400">{completionPercentage}%</span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/40">Experience</span>
                      <span className="font-medium text-white/90">{player.yearsPlaying} years</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/40">Fitness</span>
                      <span className="font-medium capitalize text-white/90">{player.fitnessLevel || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/40">Preferred Time</span>
                      <span className="font-medium capitalize text-white/90">{player.preferredTime || '—'}</span>
                    </div>
                    {player.currentClub && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">Club</span>
                        <span className="font-medium text-white/90">{player.currentClub}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      {/* Section Header with Icon and Gradient Background */}
      <div className="relative overflow-hidden rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent p-4">
        {/* Ambient glow effect */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(14,165,233,0.3) 0%, transparent 70%)",
            filter: "blur(25px)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/20 backdrop-blur-sm">
            <UserIcon className="h-5 w-5 text-sky-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Personal Information</h2>
            <p className="text-xs text-sky-300/70">Update your basic details</p>
          </div>
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Full Name <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 pl-10 text-white outline-none transition focus:border-sky-500 focus:bg-[#0d0d0f]"
            required
          />
        </div>
      </div>

      {/* Date of Birth */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Date of Birth <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <CalendarIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 pl-10 text-white outline-none transition focus:border-sky-500 focus:bg-[#0d0d0f] [color-scheme:dark]"
            required
          />
        </div>
        {age !== null && (
          <p className={`mt-1.5 text-xs ${isValidAge ? "text-white/40" : "text-red-400"}`}>
            Age: {age} years old
          </p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Gender <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-4 gap-3">
          {GENDER_OPTIONS.map((option) => {
            const isSelected = formData.gender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, gender: option.value })}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  isSelected
                    ? "border-sky-500 bg-sky-500/10 text-sky-300"
                    : "border-white/10 bg-[#0a0a0c] text-white/60 hover:border-white/20 hover:bg-[#0d0d0f]"
                }`}
              >
                <UserIcon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
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
      {/* Section Header with Icon and Gradient Background */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-4">
        {/* Ambient glow effect */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
            filter: "blur(25px)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 backdrop-blur-sm">
            <ShieldIcon className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Football Details</h2>
            <p className="text-xs text-emerald-300/70">Update your playing information</p>
          </div>
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Position <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {ROLES.map((role) => {
            const isSelected = formData.position === role.slug;
            return (
              <button
                key={role.slug}
                type="button"
                onClick={() => setFormData({ ...formData, position: role.slug })}
                className={`rounded-lg border px-3 py-3 text-xs font-medium transition ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-[#0a0a0c] text-white/60 hover:border-white/20 hover:bg-[#0d0d0f]"
                }`}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dominant Foot */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Dominant Foot <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {DOMINANT_FOOT_OPTIONS.map((option) => {
            const isSelected = formData.dominantFoot === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, dominantFoot: option.value })}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-[#0a0a0c] text-white/60 hover:border-white/20 hover:bg-[#0d0d0f]"
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
        <label className="mb-2 block text-sm font-medium text-white/70">
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
          className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-white outline-none transition focus:border-emerald-500 focus:bg-[#0d0d0f]"
        />
      </div>

      {/* Current Club */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Current Club <span className="text-white/40">(Optional)</span>
        </label>
        <input
          type="text"
          value={formData.currentClub}
          onChange={(e) => setFormData({ ...formData, currentClub: e.target.value })}
          placeholder="e.g. City Youth FC"
          className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-emerald-500 focus:bg-[#0d0d0f]"
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
      {/* Section Header with Icon and Gradient Background */}
      <div className="relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent p-4">
        {/* Ambient glow effect */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
            filter: "blur(25px)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 backdrop-blur-sm">
            <DumbbellIcon className="h-5 w-5 text-purple-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Physical Details</h2>
            <p className="text-xs text-purple-300/70">Update your physical profile</p>
          </div>
        </div>
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
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            placeholder="e.g. 165"
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-purple-500 focus:bg-[#0d0d0f]"
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
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="e.g. 55"
            className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-purple-500 focus:bg-[#0d0d0f]"
          />
        </div>
      </div>

      {/* Fitness Level */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Fitness Level <span className="text-red-400">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {FITNESS_LEVELS.map((level) => {
            const isSelected = formData.fitnessLevel === level.value;
            const colorMap: Record<string, string> = {
              beginner: isSelected ? "border-blue-500 bg-blue-500/10 text-blue-300" : "",
              intermediate: isSelected ? "border-purple-500 bg-purple-500/10 text-purple-300" : "",
              advanced: isSelected ? "border-orange-500 bg-orange-500/10 text-orange-300" : "",
            };
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => setFormData({ ...formData, fitnessLevel: level.value })}
                className={`rounded-lg border px-4 py-4 text-center transition ${
                  colorMap[level.value] ||
                  "border-white/10 bg-[#0a0a0c] text-white/60 hover:border-white/20 hover:bg-[#0d0d0f]"
                }`}
              >
                <div className="text-sm font-semibold">{level.label}</div>
                <div className="mt-1 text-xs text-white/40">{level.description}</div>
              </button>
            );
          })}
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
      {/* Section Header with Icon and Gradient Background */}
      <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent p-4">
        {/* Ambient glow effect */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
            filter: "blur(25px)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 backdrop-blur-sm">
            <TargetIcon className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Your Goals</h2>
            <p className="text-xs text-blue-300/70">Update what you want to achieve</p>
          </div>
        </div>
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
              className={`rounded-lg border px-4 py-3 text-left transition ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10 text-blue-300"
                  : "border-white/10 bg-[#0a0a0c] text-white/60 hover:border-white/20 hover:bg-[#0d0d0f]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{goal.label}</div>
                  <div className="mt-0.5 text-xs text-white/40">{goal.description}</div>
                </div>
                {isSelected && <CheckIcon className="h-4 w-4 shrink-0 text-blue-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Goal Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Add Custom Goal
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.customGoal}
            onChange={(e) => setFormData({ ...formData, customGoal: e.target.value })}
            onKeyPress={(e) => e.key === "Enter" && addCustomGoal()}
            placeholder="e.g. Play in a higher division"
            className="flex-1 rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-blue-500 focus:bg-[#0d0d0f]"
          />
          <button
            type="button"
            onClick={addCustomGoal}
            disabled={!formData.customGoal.trim()}
            className="shrink-0 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-black transition hover:bg-green-500 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Selected Goals */}
      {formData.goals.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">
            Selected Goals ({formData.goals.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {formData.goals.map((goal: string) => {
              const predefined = PREDEFINED_GOALS.find((g) => g.id === goal);
              const label = predefined?.label || goal;
              return (
                <span
                  key={goal}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-300"
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => removeGoal(goal)}
                    className="text-blue-400 hover:text-blue-300"
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
      {/* Section Header with Icon and Gradient Background */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-4">
        {/* Ambient glow effect */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)",
            filter: "blur(25px)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 backdrop-blur-sm">
            <CalendarIcon className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Availability</h2>
            <p className="text-xs text-cyan-300/70">Update your training schedule</p>
          </div>
        </div>
      </div>

      {/* Training Days */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
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
                className={`rounded-lg border px-2 py-3 text-center text-xs font-semibold transition ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-[#0a0a0c] text-white/60 hover:border-white/20 hover:bg-[#0d0d0f]"
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
        <label className="mb-2 block text-sm font-medium text-white/70">
          Preferred Time <span className="text-red-400">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          {PREFERRED_TIME_OPTIONS.map((time) => {
            const isSelected = formData.preferredTime === time.value;
            return (
              <button
                key={time.value}
                type="button"
                onClick={() => setFormData({ ...formData, preferredTime: time.value })}
                className={`rounded-lg border px-4 py-4 text-center transition ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-[#0a0a0c] text-white/60 hover:border-white/20 hover:bg-[#0d0d0f]"
                }`}
              >
                <div className="text-sm font-semibold">{time.label}</div>
                <div className="mt-1 text-xs text-white/40">{time.timeRange}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Duration */}
      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          Session Duration <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {SESSION_DURATION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleDurationChange(preset.value)}
              className={`rounded-lg border px-3 py-3 text-center text-sm font-medium transition ${
                formData.sessionDuration === preset.value && !formData.customDuration
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 bg-[#0a0a0c] text-white/60 hover:border-white/20 hover:bg-[#0d0d0f]"
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
              className={`h-full w-full rounded-lg border px-3 text-center text-sm outline-none transition ${
                formData.customDuration
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 bg-[#0a0a0c] text-white/60 placeholder-white/40"
              } focus:border-cyan-500 focus:bg-[#0d0d0f]`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
