"use client";

import { useMemo, useRef, useState } from "react";

export function SuggestInput({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const blurTimer = useRef<number | null>(null);

  const query = value.trim().toLowerCase();

  const matches = useMemo(() => {
    const unique = Array.from(new Set(options.filter(Boolean)));
    const filtered = query
      ? unique
          .filter((option) => option.toLowerCase().includes(query))
          .sort((a, b) => {
            const aName = a.toLowerCase();
            const bName = b.toLowerCase();
            const aStarts = aName.startsWith(query) ? 0 : 1;
            const bStarts = bName.startsWith(query) ? 0 : 1;
            if (aStarts !== bStarts) return aStarts - bStarts;
            return a.localeCompare(b);
          })
      : unique;
    return filtered.slice(0, 12);
  }, [options, query]);

  function clearBlurTimer() {
    if (blurTimer.current) {
      window.clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  }

  function pick(name: string) {
    clearBlurTimer();
    onChange(name);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open || matches.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(matches[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
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
        className={className}
      />

      {open && matches.length > 0 && (
        <ul
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {matches.map((item, index) => (
            <li key={item} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(item)}
                onMouseEnter={() => setHighlight(index)}
                className="flex w-full px-3 py-2 text-left text-sm text-neutral-900"
                style={{
                  background: index === highlight ? "#f5f5f5" : "transparent",
                }}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
