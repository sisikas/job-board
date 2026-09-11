"use client";

import { useMemo, useRef, useState } from "react";
import type { LocationGroup } from "@/lib/jobs";

type Suggestion = { name: string; kind: "country" | "city" };

export function LocationFilter({
  groups,
  defaultValue = "",
}: {
  groups: LocationGroup[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<number | null>(null);

  const query = value.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!query) return groups;
    return groups
      .map((group) => {
        const countryMatch = group.country.toLowerCase().includes(query);
        const matchingCities = group.cities.filter((city) =>
          city.toLowerCase().includes(query)
        );
        if (countryMatch) return group;
        if (matchingCities.length === 0) return null;
        return { country: group.country, cities: matchingCities };
      })
      .filter((group): group is LocationGroup => group !== null);
  }, [groups, query]);

  const suggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = [];
    for (const group of visibleGroups) {
      items.push({ name: group.country, kind: "country" });
      for (const city of group.cities) {
        items.push({ name: city, kind: "city" });
      }
    }
    return items;
  }, [visibleGroups]);

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
        placeholder="Type City or Country"
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
          className="absolute z-20 mt-1 max-h-72 w-full min-w-[14rem] overflow-auto rounded-xl py-1 shadow-lg"
          style={{
            background: "var(--brand-card)",
            border: "1px solid var(--brand-card-border)",
          }}
        >
          {suggestions.map((item, index) => (
            <li key={`${item.kind}-${item.name}-${index}`} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(item.name)}
                onMouseEnter={() => setHighlight(index)}
                className={`flex w-full text-left ${
                  item.kind === "country"
                    ? "px-3 py-2 text-sm font-semibold"
                    : "px-3 py-1.5 pl-7 text-sm"
                }`}
                style={{
                  background: index === highlight ? "var(--brand-cream)" : "transparent",
                  color: item.kind === "country" ? "var(--brand-ink)" : "var(--brand-muted)",
                }}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
