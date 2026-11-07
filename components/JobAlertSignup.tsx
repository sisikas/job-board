"use client";

import { useEffect } from "react";
import { openAuth } from "@/components/AuthModal";

const NEXT = "/job-alerts";

export function JobAlertSignup() {
  useEffect(() => {
    const id = window.setTimeout(() => openAuth(NEXT, "signup"), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="mx-auto max-w-xl px-6 pt-4 pb-20">
      <h1 className="text-4xl font-bold tracking-tight">Get job alerts</h1>
      <p className="mt-3 text-base leading-relaxed" style={{ color: "#5C5140" }}>
        Create a free account, then tell us the roles and places you want. We&apos;ll email you when
        one of those jobs goes up.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openAuth(NEXT, "signup")}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white"
          style={{ background: "var(--brand-logo-green)" }}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => openAuth(NEXT, "login")}
          className="rounded-full px-5 py-2.5 text-sm font-bold"
          style={{
            color: "var(--brand-logo-green)",
            boxShadow: "inset 0 0 0 1.5px var(--brand-logo-green)",
          }}
        >
          Log in
        </button>
      </div>
    </div>
  );
}
