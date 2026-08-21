"use client";

import { useMemo, useRef, useState } from "react";

type Suggestion = { name: string; kind: "City" | "Country" };

export function LocationFilter({
  cities,
  countries,
  defaultValue = "",
}: {
  cities: string[];
  countries: string[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<number | null>(null);

  const query = value.trim().toLowerCase();

  const suggestions = useMemo<Suggestion[]>(() => {
    const cityHits = cities.filter((c) => !query || c.toLowerCase().includes(query));
    const countryHits = countries.filter((c) => !query || c.toLowerCase().includes(query));
    return [
      ...cityHits.map((name) => ({ name, kind: "City" as const })),
      ...countryHits.map((name) => ({ name, kind: "Country" as const })),
    ];
  }, [cities, countries, query]);

  function clearBlurTimer() {
    if (blurTimer.current) {
      window.clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  }

  function pick(name: string) {
    clearBlurTimer();
    setValue(name);
    setOpen(false);
    const input = inputRef.current;
    if (input) {
      input.value = name;
      input.form?.requestSubmit();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(suggestions[highlight].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative sm:w-56">
      <input
        ref={inputRef}
        type="text"
        name="location"
        value={value}
        autoComplete="off"
        placeholder="City or country"
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => {
          clearBlurTimer();
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{
          background: "var(--brand-card)",
          border: "1px solid var(--brand-input-border)",
          color: "var(--brand-ink)",
        }}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="location-suggestions"
      />

      {open && suggestions.length > 0 && (
        <ul
          id="location-suggestions"
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl py-1 shadow-lg"
          style={{
            background: "var(--brand-card)",
            border: "1px solid var(--brand-card-border)",
          }}
        >
          {suggestions.map((item, index) => (
            <li key={`${item.kind}-${item.name}`} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(item.name)}
                onMouseEnter={() => setHighlight(index)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                style={{
                  background: index === highlight ? "var(--brand-cream)" : "transparent",
                  color: "var(--brand-ink)",
                }}
              >
                <span>{item.name}</span>
                <span className="text-xs" style={{ color: "var(--brand-muted)" }}>
                  {item.kind}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
