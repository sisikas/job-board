"use client";

import { useEffect, useState } from "react";

const notes = [
  "A person is included only when they asked for alerts and have not unsubscribed. People who said no at signup are left out.",
  "The job's role must be one of their roles. Chef and Sous Chef stay separate. Part-time and private versions of that same role are included, in any spacing or punctuation, such as Chef (part-time) or Private Chef.",
  "The job's city or country must be one of their places. A country covers every job in that country. Anywhere covers every city.",
  "All of one person's matches go in a single email.",
  "The job's admin date must be after the day they subscribed. If they have already been emailed, it must also be after that last email. The employer's posted date is not used.",
];

export function AlertConditions() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
      >
        Conditions
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(23, 23, 23, 0.45)" }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-conditions-title"
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="alert-conditions-title" className="text-base font-semibold text-neutral-900">
                Conditions
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-neutral-500 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-neutral-700">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
