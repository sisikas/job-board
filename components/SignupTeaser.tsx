"use client";

import { openAuth } from "@/components/AuthModal";

export function SignupTeaser({ hiddenCount, next }: { hiddenCount: number; next: string }) {
  return (
    <div
      className="flex h-full flex-col justify-center rounded-2xl border-2 border-dashed p-5 text-center"
      style={{ borderColor: "var(--brand-logo-green)", background: "var(--brand-card)" }}
    >
      <p className="text-lg font-bold leading-snug" style={{ color: "var(--brand-ink)" }}>
        {hiddenCount > 0
          ? `${hiddenCount} more ${hiddenCount === 1 ? "job is" : "jobs are"} waiting`
          : "See every new job first"}
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--brand-muted)" }}>
        Sign up free to see every role and search by role or location.
      </p>
      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => openAuth(next)}
          className="rounded-full px-5 py-2 text-sm font-bold text-white"
          style={{ background: "var(--brand-logo-green)" }}
        >
          Sign up free
        </button>
        <button
          type="button"
          onClick={() => openAuth(next, "login")}
          className="text-sm font-semibold underline underline-offset-2"
          style={{ color: "var(--brand-muted)" }}
        >
          I already have an account
        </button>
      </div>
    </div>
  );
}
