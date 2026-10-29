"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteSignup } from "@/app/actions/admin-users";

function ConfirmButtons({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
      >
        Cancel
      </button>
    </>
  );
}

export function ConfirmDelete({
  email,
  kind,
}: {
  email: string;
  kind: "signup" | "onboarder";
}) {
  const [open, setOpen] = useState(false);
  const question =
    kind === "onboarder" ? "Delete this onboarder?" : "Delete this sign-up?";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-red-700 underline underline-offset-2 hover:text-red-900"
      >
        Delete
      </button>
    );
  }

  return (
    <form
      action={deleteSignup}
      className="flex flex-col items-start gap-2"
    >
      <input type="hidden" name="email" value={email} />
      <p className="text-sm text-neutral-700">
        {question}{" "}
        <span className="font-medium text-neutral-900">{email}</span> will be removed.
        This can&apos;t be undone.
      </p>
      <ConfirmButtons onCancel={() => setOpen(false)} />
    </form>
  );
}
