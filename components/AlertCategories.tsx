"use client";

import { useState, type ReactNode } from "react";

export type AlertCategory = {
  id: string;
  value: number;
  label: string;
  tone?: "red";
};

export function AlertCategories({
  options,
  panels,
}: {
  options: AlertCategory[];
  panels: Record<string, ReactNode>;
}) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {options.map((option) => {
          const selected = active === option.id;
          const red = option.tone === "red";
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(selected ? null : option.id)}
              className={`rounded-xl border bg-white px-4 py-3 text-left hover:bg-neutral-50 ${
                red ? "border-red-500" : "border-neutral-200"
              } ${selected ? (red ? "ring-2 ring-red-600" : "ring-2 ring-neutral-900") : ""}`}
            >
              <span className={`block text-2xl font-semibold ${red ? "text-red-600" : "text-neutral-900"}`}>
                {option.value}
              </span>
              <span className={`mt-0.5 block text-sm ${red ? "font-bold text-red-600" : "text-neutral-500"}`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      {active && panels[active] ? <div className="mt-4">{panels[active]}</div> : null}
    </>
  );
}
