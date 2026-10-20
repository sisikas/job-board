"use client";

import { useActionState } from "react";
import { completePasswordReset, type AuthState } from "@/app/actions/auth";
import { openAuth } from "@/components/AuthModal";

const inputClass = "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2";
const inputStyle = {
  background: "var(--brand-cream)",
  border: "1px solid var(--brand-input-border)",
  color: "var(--brand-ink)",
};
const buttonClass =
  "mt-1 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60";

export function ResetPasswordForm({ token, valid }: { token: string; valid: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    completePasswordReset,
    undefined
  );

  if (!valid) {
    return (
      <>
        <h1 className="text-xl font-bold" style={{ color: "var(--brand-ink)" }}>
          This link has expired
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--brand-muted)" }}>
          Reset links work for 1 hour and only once. Ask for a new one and
          we&apos;ll email it to you.
        </p>
        <button
          type="button"
          onClick={() => openAuth("/", "forgot")}
          className={`${buttonClass} mt-5 w-full`}
          style={{ background: "var(--brand-logo-green)" }}
        >
          Send me a new link
        </button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold" style={{ color: "var(--brand-ink)" }}>
        Choose a new password
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--brand-muted)" }}>
        You&apos;ll be logged in straight after.
      </p>

      <form action={action} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="token" value={token} />
        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
          New password
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
            style={inputStyle}
          />
          <span className="text-xs font-normal" style={{ color: "var(--brand-date)" }}>
            At least 8 characters.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--brand-ink)" }}>
          Type it again
          <input
            type="password"
            name="confirm"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
            style={inputStyle}
          />
        </label>

        {state?.error && (
          <p role="alert" className="text-sm font-semibold" style={{ color: "#b3412e" }}>
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={buttonClass}
          style={{ background: "var(--brand-logo-green)" }}
        >
          {pending ? "One moment…" : "Save new password"}
        </button>
      </form>
    </>
  );
}
