// src/lib/onboarding.ts
//
// Constants and utilities for the player onboarding flow.
// This file contains predefined options for goals, fitness levels, and other
// onboarding-related data that doesn't belong in the core types file.

import type { Gender, DominantFoot, FitnessLevel, PreferredTime, TrainingDay } from "@/src/types";

// ---------------------------------------------------------------------------
// Gender Options
// ---------------------------------------------------------------------------

export const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: "male", label: "Male", icon: "👨" },
  { value: "female", label: "Female", icon: "👩" },
  { value: "other", label: "Other", icon: "🧑" },
  { value: "prefer-not-to-say", label: "Prefer not to say", icon: "—" },
];

// ---------------------------------------------------------------------------
// Dominant Foot Options
// ---------------------------------------------------------------------------

export const DOMINANT_FOOT_OPTIONS: {
  value: DominantFoot;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: "left",
    label: "Left",
    icon: "👟",
    description: "Primary left-footed",
  },
  {
    value: "right",
    label: "Right",
    icon: "👟",
    description: "Primary right-footed",
  },
  {
    value: "both",
    label: "Both",
    icon: "👟👟",
    description: "Equally comfortable with both feet",
  },
];

// ---------------------------------------------------------------------------
// Fitness Level Options
// ---------------------------------------------------------------------------

export const FITNESS_LEVELS: {
  value: FitnessLevel;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Just starting out or getting back into training",
    icon: "🌱",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Regular training, comfortable with sustained activity",
    icon: "💪",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "High-intensity training, competitive level fitness",
    icon: "🔥",
  },
];

// ---------------------------------------------------------------------------
// Predefined Goals
// ---------------------------------------------------------------------------

export const PREDEFINED_GOALS: {
  id: string;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "improve-fitness",
    label: "Improve overall fitness",
    description: "Build stamina, strength, and endurance",
    icon: "💪",
  },
  {
    id: "make-team",
    label: "Make the first team",
    description: "Earn a spot in the starting lineup",
    icon: "⭐",
  },
  {
    id: "get-scouted",
    label: "Get scouted by academies",
    description: "Attract attention from professional scouts",
    icon: "🔍",
  },
  {
    id: "turn-pro",
    label: "Turn professional",
    description: "Take the next step to professional football",
    icon: "🏆",
  },
  {
    id: "improve-weak-foot",
    label: "Improve weak foot",
    description: "Become more confident with your weaker foot",
    icon: "👟",
  },
  {
    id: "build-stamina",
    label: "Build stamina and endurance",
    description: "Last the full 90 minutes at peak performance",
    icon: "🏃",
  },
  {
    id: "master-technical",
    label: "Master technical skills",
    description: "Perfect your passing, dribbling, and control",
    icon: "⚽",
  },
  {
    id: "compete-higher",
    label: "Compete at higher level",
    description: "Play in more competitive leagues or age groups",
    icon: "📈",
  },
];

// ---------------------------------------------------------------------------
// Preferred Time Options
// ---------------------------------------------------------------------------

export const PREFERRED_TIME_OPTIONS: {
  value: PreferredTime;
  label: string;
  timeRange: string;
  icon: string;
}[] = [
  {
    value: "morning",
    label: "Morning",
    timeRange: "6:00 AM - 12:00 PM",
    icon: "🌅",
  },
  {
    value: "afternoon",
    label: "Afternoon",
    timeRange: "12:00 PM - 6:00 PM",
    icon: "☀️",
  },
  {
    value: "evening",
    label: "Evening",
    timeRange: "6:00 PM - 10:00 PM",
    icon: "🌙",
  },
];

// ---------------------------------------------------------------------------
// Training Days Options
// ---------------------------------------------------------------------------

export const TRAINING_DAYS_OPTIONS: {
  value: TrainingDay;
  label: string;
  shortLabel: string;
}[] = [
  { value: "monday", label: "Monday", shortLabel: "Mon" },
  { value: "tuesday", label: "Tuesday", shortLabel: "Tue" },
  { value: "wednesday", label: "Wednesday", shortLabel: "Wed" },
  { value: "thursday", label: "Thursday", shortLabel: "Thu" },
  { value: "friday", label: "Friday", shortLabel: "Fri" },
  { value: "saturday", label: "Saturday", shortLabel: "Sat" },
  { value: "sunday", label: "Sunday", shortLabel: "Sun" },
];

// ---------------------------------------------------------------------------
// Session Duration Presets
// ---------------------------------------------------------------------------

export const SESSION_DURATION_PRESETS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "120 min" },
];

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Calculate age from date of birth.
 * @param dateOfBirth ISO date string (YYYY-MM-DD)
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validate that a date of birth is reasonable for a player (ages 10-39).
 * @param dateOfBirth ISO date string (YYYY-MM-DD)
 * @returns True if age is between 10 and 39
 */
export function isValidYouthAge(dateOfBirth: string): boolean {
  const age = calculateAge(dateOfBirth);
  return age >= 10 && age <= 39;
}

/**
 * Format date for display.
 * @param isoDate ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "Jan 15, 2010")
 */
export function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get the label for a predefined goal by its ID.
 * @param goalId The goal ID
 * @returns The goal label or the ID itself if not found
 */
export function getGoalLabel(goalId: string): string {
  const goal = PREDEFINED_GOALS.find((g) => g.id === goalId);
  return goal?.label ?? goalId;
}

/**
 * Check if a goal is a predefined one or custom.
 * @param goal The goal string
 * @returns True if it's a predefined goal
 */
export function isPredefinedGoal(goal: string): boolean {
  return PREDEFINED_GOALS.some((g) => g.id === goal);
}
