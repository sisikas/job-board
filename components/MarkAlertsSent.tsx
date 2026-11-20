"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { markAlertsSentAction } from "@/app/actions/admin-alerts";

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function MarkAlertsSent({
  ids = [],
  pairs = [],
  label,
  confirm,
  mode = "mark",
}: {
  ids?: string[];
  pairs?: { userId: string; jobId: string }[];
  label: string;
  confirm: string;
  mode?: "mark" | "clear";
}) {
  const [open, setOpen] = useState(false);
  if (mode === "clear" ? ids.length === 0 : pairs.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
      >
        {label}
      </button>
    );
  }

  return (
    <form action={markAlertsSentAction} className="flex flex-col items-start gap-2">
      {mode === "clear" && <input type="hidden" name="mode" value="clear" />}
      {mode === "clear"
        ? ids.map((id) => <input key={id} type="hidden" name="id" value={id} />)
        : pairs.map((pair) => (
            <input
              key={`${pair.userId}|${pair.jobId}`}
              type="hidden"
              name="sent"
              value={`${pair.userId}|${pair.jobId}`}
            />
          ))}
      <p className="max-w-md text-sm text-neutral-700">{confirm}</p>
      <div className="flex items-center gap-2">
        <ConfirmButton label={mode === "clear" ? "Yes, clear it" : "Yes, mark as sent"} />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
