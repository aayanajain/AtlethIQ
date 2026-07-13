"use client";
// src/components/SessionCalendar.tsx
//
// A month calendar that highlights the days a session was logged (teal), with
// today ringed. Prev/next arrows browse other months. Dark design system.

import { useState } from "react";
import { toDateKey } from "@/src/lib/dates";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function SessionCalendar({ loggedDates }: { loggedDates: Set<string> }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const todayKeyStr = toDateKey(now);

  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

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
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 backdrop-blur-sm">
      {/* Month header + arrows */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="h-7 w-7 rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          ‹
        </button>
        <div className="text-sm font-medium text-white">{monthLabel}</div>
        <button
          onClick={nextMonth}
          className="h-7 w-7 rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          ›
        </button>
      </div>

      {/* Weekday labels */}
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs text-white/40">
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
                "flex h-9 items-center justify-center rounded-lg text-sm " +
                (logged
                  ? "bg-teal-500 font-medium text-black"
                  : "text-white/60") +
                (isToday && !logged ? " ring-1 ring-teal-500/70" : "")
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
