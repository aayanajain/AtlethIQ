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
