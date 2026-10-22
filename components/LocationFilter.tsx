"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LocationGroup } from "@/lib/jobs";
import type { PlaceHit } from "@/lib/places";

function localPlaces(groups: LocationGroup[], query: string): PlaceHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: PlaceHit[] = [];
  for (const group of groups) {
    if (group.country.toLowerCase().includes(q)) {
      hits.push({ label: group.country, city: "", country: group.country });
    }
    for (const city of group.cities) {
      if (city.toLowerCase().includes(q)) {
        hits.push({ label: `${city}, ${group.country}`, city, country: group.country });
      }
    }
  }
  return hits;
}

function mergePlaces(remote: PlaceHit[], local: PlaceHit[], limit = 8): PlaceHit[] {
  const seen = new Set<string>();
  const merged: PlaceHit[] = [];
  for (const hit of [...remote, ...local]) {
    const key = hit.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
    if (merged.length >= limit) break;
  }
  return merged;
}

export function LocationFilter({
  groups,
  placeLabel = "",
  city = "",
  country = "",
  fullWidth = false,
}: {
  groups: LocationGroup[];
  placeLabel?: string;
  city?: string;
  country?: string;
  fullWidth?: boolean;
}) {
  const initialPick: PlaceHit | null =
    city || country ? { label: placeLabel, city, country } : null;
  const [text, setText] = useState(placeLabel);
  const [picked, setPicked] = useState<PlaceHit | null>(initialPick);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [remote, setRemote] = useState<PlaceHit[]>([]);
  const blurTimer = useRef<number | null>(null);

  const suggestions = useMemo(() => {
    if (text.trim().length < 2) return [];
    return mergePlaces(remote, localPlaces(groups, text));
  }, [remote, groups, text]);

  useEffect(() => {
    const query = text.trim();
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((hits: PlaceHit[]) => {
          setRemote(hits);
          setHighlight(0);
        })
        .catch(() => {});
    }, 150);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [text]);

  function clearBlurTimer() {
    if (blurTimer.current) {
      window.clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  }

  function pick(hit: PlaceHit) {
    clearBlurTimer();
    setText(hit.label);
    setPicked(hit);
    setOpen(false);
  }

  const usingPick = picked !== null && text === picked.label;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(suggestions[highlight] ?? suggestions[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={fullWidth ? "relative w-full" : "relative sm:w-56"}>
      {usingPick ? (
        <>
          {picked.city ? <input type="hidden" name="city" value={picked.city} /> : null}
          <input type="hidden" name="country" value={picked.country} />
        </>
      ) : null}
      <input
        type="text"
        name={usingPick ? undefined : "location"}
        value={text}
        autoComplete="off"
        placeholder="City or country"
        onChange={(e) => {
          setText(e.target.value);
          setRemote([]);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => {
          clearBlurTimer();
          if (text.trim().length >= 2) setOpen(true);
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
        aria-expanded={open && suggestions.length > 0}
        aria-autocomplete="list"
        aria-controls={fullWidth ? "location-suggestions-side" : "location-suggestions"}
      />

      {open && suggestions.length > 0 && (
        <ul
          id={fullWidth ? "location-suggestions-side" : "location-suggestions"}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full min-w-[16rem] overflow-auto rounded-xl py-1 shadow-lg"
          style={{
            background: "var(--brand-card)",
            border: "1px solid var(--brand-card-border)",
          }}
        >
          {suggestions.map((hit, index) => (
            <li key={hit.label} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(hit)}
                onMouseEnter={() => setHighlight(index)}
                className="flex w-full flex-col px-3 py-1.5 text-left"
                style={{ background: index === highlight ? "var(--brand-cream)" : "transparent" }}
              >
                <span className="text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
                  {hit.city || hit.country}
                </span>
                {hit.city ? (
                  <span className="text-xs" style={{ color: "var(--brand-muted)" }}>
                    {hit.country}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--brand-date)" }}>
                    Country
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
