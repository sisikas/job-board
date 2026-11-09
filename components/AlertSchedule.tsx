"use client";

import { useEffect, useState } from "react";
import { saveAlertNote, toggleAlertDay } from "@/app/actions/admin-alert-schedule";
import type { AlertDay } from "@/lib/alert-schedule";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dayKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function dayLabel(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AlertSchedule({
  year,
  month,
  days,
}: {
  year: number;
  month: number;
  days: AlertDay[];
}) {
  const [marks, setMarks] = useState(() => new Map(days.map((day) => [day.day, day])));
  const [pending, setPending] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const today = new Date();
  const todayKey = dayKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leading = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const sentCount = [...marks.values()].filter((day) => day.sent).length;

  function mark(day: string): AlertDay {
    return marks.get(day) ?? { day, sent: false, note: "" };
  }

  function put(next: AlertDay) {
    setMarks((current) => {
      const copy = new Map(current);
      if (!next.sent && !next.note) copy.delete(next.day);
      else copy.set(next.day, next);
      return copy;
    });
  }

  async function toggle(day: string) {
    const previous = mark(day);
    put({ ...previous, sent: !previous.sent });
    setPending(day);
    const result = await toggleAlertDay(day);
    setPending(null);
    if (result === null || result === previous.sent) put(previous);
  }

  function openNote(day: string) {
    setEditing(day);
    setDraft(mark(day).note);
  }

  function closeNote() {
    if (saving) return;
    setEditing(null);
    setDraft("");
  }

  useEffect(() => {
    if (!editing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNote();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editing, saving]);

  async function saveNote(note: string) {
    if (!editing) return;
    const day = editing;
    const previous = mark(day);
    setSaving(true);
    const saved = await saveAlertNote(day, note);
    setSaving(false);
    if (saved === null) return;
    put({ ...previous, note: saved });
    setEditing(null);
    setDraft("");
  }

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-600">
        <span className="font-semibold text-neutral-900">{sentCount}</span>{" "}
        {sentCount === 1 ? "day" : "days"} ticked this month.
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
              return <div key={`empty-${index}`} className="min-h-24 border-b border-r border-neutral-100 bg-neutral-50" />;
            }
            const key = dayKey(year, month, day);
            const entry = mark(key);
            const isToday = key === todayKey;
            return (
              <div key={key} className="flex min-h-24 flex-col border-b border-r border-neutral-100 p-2">
                <button
                  type="button"
                  onClick={() => openNote(key)}
                  className="flex flex-1 flex-col items-start gap-1 text-left"
                  aria-label={`${dayLabel(key)}${entry.note ? `, note: ${entry.note}` : ", no note"}`}
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
                  {entry.note ? (
                    <span className="line-clamp-2 text-[11px] leading-snug text-neutral-600">{entry.note}</span>
                  ) : (
                    <span className="text-[11px] text-neutral-300">Add note</span>
                  )}
                </button>
                <button
                  type="button"
                  aria-pressed={entry.sent}
                  disabled={pending === key}
                  onClick={() => toggle(key)}
                  className={
                    entry.sent
                      ? "mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800 disabled:opacity-60"
                      : "mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 disabled:opacity-60"
                  }
                >
                  <span aria-hidden="true">{entry.sent ? "✓" : "○"}</span>
                  {entry.sent ? "Sent" : "Not sent"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(23, 23, 23, 0.45)" }}
          onClick={closeNote}
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-note-title"
        >
          <form
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void saveNote(draft);
            }}
          >
            <h2 id="alert-note-title" className="text-base font-semibold text-neutral-900">
              {dayLabel(editing)}
            </h2>
            <label className="mt-4 block text-sm font-medium text-neutral-700">
              Note
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                maxLength={2000}
                autoFocus
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-900 focus:border-neutral-500 focus:outline-none"
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              {mark(editing).note && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveNote("")}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-red-700 hover:text-red-900 disabled:opacity-60"
                >
                  Delete note
                </button>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={closeNote}
                className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
