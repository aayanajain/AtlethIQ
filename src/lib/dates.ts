// src/lib/dates.ts
//
// Small date helpers for the calendar + streak. We work with "date keys" —
// plain "YYYY-MM-DD" strings — because that's how sessions store their date,
// and strings are easy to compare and put in a Set.

// Format a Date as "YYYY-MM-DD" using LOCAL time (not UTC), so "today" matches
// the player's own day.
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Today's date key.
export function todayKey(): string {
  return toDateKey(new Date());
}

// Is this date key in the current calendar WEEK (Monday–Sunday)?
export function isThisWeek(dateKey: string): boolean {
  const now = new Date();
  // How many days since Monday. getDay(): Sun=0..Sat=6 → make Mon=0..Sun=6.
  const sinceMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - sinceMonday);
  // "YYYY-MM-DD" strings sort the same as dates, so a plain compare works.
  return dateKey >= toDateKey(monday);
}

// Is this date key in the current calendar MONTH?
export function isThisMonth(dateKey: string): boolean {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return dateKey.startsWith(prefix);
}

// The current streak: how many days in a row (ending today, or yesterday so it
// doesn't reset the moment midnight passes) have at least one logged session.
export function computeStreak(dateKeys: string[]): number {
  const days = new Set(dateKeys);
  if (days.size === 0) return 0;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Where do we start counting back from?
  let cursor: Date;
  if (days.has(toDateKey(today))) {
    cursor = new Date(today);
  } else if (days.has(toDateKey(yesterday))) {
    cursor = new Date(yesterday);
  } else {
    return 0; // no session today or yesterday → streak is broken
  }

  // Walk backwards while each day has a session.
  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
