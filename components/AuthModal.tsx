"use client";

import { useActionState, useEffect, useState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";

type Mode = "signup" | "login";

const OPEN_EVENT = "tgs-open-auth";

type OpenDetail = { next: string; mode: Mode };

export function openAuth(next: string, mode: Mode = "signup") {
  window.dispatchEvent(new CustomEvent<OpenDetail>(OPEN_EVENT, { detail: { next, mode } }));
}

export function AuthModal() {
  const [request, setRequest] = useState<OpenDetail | null>(null);

  useEffect(() => {
    const onOpen = (event: Event) => setRequest((event as CustomEvent<OpenDetail>).detail);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRequest(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [request]);

  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(33, 28, 20, 0.5)" }}
      onClick={() => setRequest(null)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--brand-card)", border: "1px solid var(--brand-card-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <AuthForm
          key={request.mode}
          mode={request.mode}
          next={request.next}
          onSwitch={(mode) => setRequest({ ...request, mode })}
          onClose={() => setRequest(null)}
        />
      </div>
    </div>
  );
}

function AuthForm({
  mode,
  next,
  onSwitch,
  onClose,
}: {
  mode: Mode;
  next: string;
  onSwitch: (mode: Mode) => void;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "signup" ? signup : login,
    undefined
  );
  const isSignup = mode === "signup";

  const inputClass = "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2";
  const inputStyle = {
    background: "var(--brand-cream)",
    border: "1px solid var(--brand-input-border)",
    color: "var(--brand-ink)",
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="auth-title" className="text-xl font-bold" style={{ color: "var(--brand-ink)" }}>
            {isSignup ? "See every open job" : "Welcome back"}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--brand-muted)" }}>
            {isSignup
              ? "Create a free account to browse and search all the roles."
              : "Log in to browse and search all the roles."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 text-xl leading-none"
          style={{ color: "var(--brand-muted)" }}
        >
          &times;
        </button>
      </div>

      <form action={action} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={state?.email}
            className={inputClass}
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
          Password
          <input
            type="password"
            name="password"
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className={inputClass}
            style={inputStyle}
          />
          {isSignup && (
            <span className="text-xs font-normal" style={{ color: "var(--brand-date)" }}>
              At least 8 characters.
            </span>
          )}
        </label>

        {state?.error && (
          <p role="alert" className="text-sm font-semibold" style={{ color: "#b3412e" }}>
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: "var(--brand-logo-green)" }}
        >
          {pending ? "One moment…" : isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm" style={{ color: "var(--brand-muted)" }}>
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <button
          type="button"
          onClick={() => onSwitch(isSignup ? "login" : "signup")}
          className="font-bold underline underline-offset-2"
          style={{ color: "var(--brand-logo-green)" }}
        >
          {isSignup ? "Log in" : "Create account"}
        </button>
      </p>
    </>
  );
}
