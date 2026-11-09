"use client";

import { useState } from "react";
import { toggleAlertDay } from "@/app/actions/admin-alert-schedule";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dayKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function AlertSchedule({
  year,
  month,
  sentDays,
}: {
  year: number;
  month: number;
  sentDays: string[];
}) {
  const [sent, setSent] = useState(() => new Set(sentDays));
  const [pending, setPending] = useState<string | null>(null);
  const today = new Date();
  const todayKey = dayKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leading = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  async function toggle(day: string) {
    const previous = sent.has(day);
    setSent((current) => {
      const next = new Set(current);
      if (previous) next.delete(day);
      else next.add(day);
      return next;
    });
    setPending(day);
    const result = await toggleAlertDay(day);
    setPending(null);
    if (result === null || result === previous) {
      setSent((current) => {
        const next = new Set(current);
        if (previous) next.add(day);
        else next.delete(day);
        return next;
      });
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-600">
        <span className="font-semibold text-neutral-900">{sent.size}</span>{" "}
        {sent.size === 1 ? "day" : "days"} ticked this month.
      </p>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
          {WEEKDAYS.map((label) => (
            <div key={label} className="px-2 py-2 text-center text-xs font-medium text-neutral-500">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-16 border-b border-r border-neutral-100 bg-neutral-50" />;
            }
            const key = dayKey(year, month, day);
            const isSent = sent.has(key);
            const isToday = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isSent}
                aria-label={`${key}, ${isSent ? "alert sent" : "no alert sent"}`}
                disabled={pending === key}
                onClick={() => toggle(key)}
                className="flex min-h-16 flex-col items-start gap-2 border-b border-r border-neutral-100 p-2 text-left hover:bg-neutral-50 disabled:opacity-60"
              >
                <span
                  className={
                    isToday
                      ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white"
                      : "text-xs font-semibold text-neutral-700"
                  }
                >
                  {day}
                </span>
                <span
                  className={
                    isSent
                      ? "inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800"
                      : "inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500"
                  }
                >
                  <span aria-hidden="true">{isSent ? "✓" : "○"}</span>
                  {isSent ? "Sent" : "Not sent"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
