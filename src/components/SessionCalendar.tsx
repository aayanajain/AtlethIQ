"use client";
// src/components/SessionCalendar.tsx
//
// A month calendar that highlights the days a session was logged. Take a Set of
// "YYYY-MM-DD" keys and it shades those days green. Today gets a ring. Prev/next
// arrows browse other months.

import { useState } from "react";
import { toDateKey } from "@/src/lib/dates";

const DOW = ["S", "M", "T", "W", "T", "F", "S"]; // day-of-week headers

export function SessionCalendar({ loggedDates }: { loggedDates: Set<string> }) {
  const now = new Date();
  // Which month we're viewing (starts on the current month).
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0 = January
  const todayKeyStr = toDateKey(now);

  // Layout maths for the grid.
  const startWeekday = new Date(year, month, 1).getDay(); // blank cells before day 1
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // 0th of next month = last day
  const monthLabel = new Date(year, month, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Build the cells: leading blanks, then 1..daysInMonth.
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      {/* Month header + arrows */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="h-7 w-7 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ‹
        </button>
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {monthLabel}
        </div>
        <button
          onClick={nextMonth}
          className="h-7 w-7 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ›
        </button>
      </div>

      {/* Weekday labels */}
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">
        {DOW.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = toDateKey(new Date(year, month, d));
          const logged = loggedDates.has(key);
          const isToday = key === todayKeyStr;
          return (
            <div
              key={i}
              className={
                "flex h-8 items-center justify-center rounded-lg text-sm " +
                (logged
                  ? "bg-emerald-600 font-medium text-white"
                  : "text-zinc-600 dark:text-zinc-400") +
                (isToday && !logged ? " ring-1 ring-emerald-500" : "")
              }
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
