"use client";

import { startTransition, useEffect, useState } from "react";
import { unsubscribeFromAlerts } from "@/app/actions/unsubscribe";

type Status = "working" | "done" | "missing";

/** The email link lands here and leaves the list immediately. There is no confirm step. */
export function UnsubscribeOnOpen({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("working");

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      void unsubscribeFromAlerts(token)
        .then((ok) => {
          if (!cancelled) setStatus(ok ? "done" : "missing");
        })
        .catch(() => {
          if (!cancelled) setStatus("missing");
        });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "done") {
    return (
      <>
        <h1 className="text-xl font-bold" style={{ color: "var(--brand-ink)" }}>
          You’re unsubscribed
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--brand-muted)" }}>
          You won’t get job alerts from The Good Sort.
        </p>
      </>
    );
  }

  if (status === "missing") {
    return (
      <>
        <h1 className="text-xl font-bold" style={{ color: "var(--brand-ink)" }}>
          This link doesn’t match an account
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--brand-muted)" }}>
          Job alerts were left as they are.
        </p>
      </>
    );
  }

  return (
    <p className="text-sm leading-relaxed" style={{ color: "var(--brand-muted)" }}>
      Taking you off job alerts…
    </p>
  );
}
