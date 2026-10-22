"use client";

import { useSyncExternalStore } from "react";
import { applyClarityConsent, CONSENT_KEY, type ConsentChoice } from "@/lib/clarity-consent";

const PENDING = "pending";
const CHANGE = "tgs-consent-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE, onStoreChange);
  };
}

function getSnapshot() {
  return localStorage.getItem(CONSENT_KEY) ?? "unset";
}

function getServerSnapshot() {
  return PENDING;
}

function choose(choice: ConsentChoice) {
  localStorage.setItem(CONSENT_KEY, choice);
  applyClarityConsent(choice);
  window.dispatchEvent(new Event(CHANGE));
}

export function CookieNotice() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (stored !== "unset") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div
        role="region"
        aria-label="Cookie notice"
        className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:gap-5 sm:px-5 sm:py-4"
        style={{
          background: "var(--brand-card)",
          borderColor: "var(--brand-card-border)",
          borderLeftWidth: 6,
          borderLeftColor: "var(--brand-brick)",
          borderBottomWidth: 4,
          borderBottomColor: "var(--brand-brick)",
          boxShadow: "0 10px 30px rgba(33, 28, 20, 0.12)",
        }}
      >
        <p className="text-sm leading-snug" style={{ color: "var(--brand-body)" }}>
          We use cookies to improve your experience.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-full px-4 py-2 text-sm font-bold"
            style={{ color: "var(--brand-ink)", boxShadow: "inset 0 0 0 1.5px var(--brand-input-border)" }}
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-full px-4 py-2 text-sm font-bold text-white"
            style={{ background: "var(--brand-logo-green)" }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
