"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteJobRequestAction, saveJobRequestNotesAction } from "@/app/actions/admin-requests";
import { LocalTime } from "@/components/LocalTime";
import type { JobRequest } from "@/lib/job-requests";

function matches(request: JobRequest, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    request.business,
    request.role,
    request.city,
    request.email,
    request.pay,
    request.description,
    request.about,
    request.apply,
    request.notes,
  ]
    .join("\n")
    .toLowerCase()
    .includes(q);
}

function DeleteButtons({ onCancel, label }: { onCancel: () => void; label: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
      >
        {pending ? "Deleting…" : label}
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

function DeleteRequest({ id, business }: { id: string; business: string }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  if (step === 0) {
    return (
      <button
        type="button"
        onClick={() => setStep(1)}
        className="text-sm text-red-700 underline underline-offset-2 hover:text-red-900"
      >
        Delete
      </button>
    );
  }

  if (step === 1) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-neutral-700">Delete this request?</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Yes, continue
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={deleteJobRequestAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-neutral-700">
        Last check. <span className="font-medium text-neutral-900">{business}</span> will be removed.
        This can&apos;t be undone.
      </p>
      <div className="flex items-center gap-2">
        <DeleteButtons onCancel={() => setStep(0)} label="Delete it" />
      </div>
    </form>
  );
}

function Field({ label, value, href }: { label: string; value: string; href?: string }) {
  const text = value.trim();
  return (
    <div className="mt-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</h3>
      {text ? (
        href ? (
          <a href={href} className="mt-1 inline-block text-sm text-neutral-900 underline">
            {text}
          </a>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">{text}</p>
        )
      ) : (
        <p className="mt-1 text-sm text-neutral-400">—</p>
      )}
    </div>
  );
}

function SaveNotesButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save notes"}
    </button>
  );
}

export function JobRequestList({ requests }: { requests: JobRequest[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => requests.filter((request) => matches(request, query)), [requests, query]);
  const searching = query.trim().length > 0;

  return (
    <>
      <label className="mb-4 block">
        <span className="sr-only">Search ad requests</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by business, role, city, or email"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
        />
      </label>

      <p className="mb-4 text-sm text-neutral-600">
        {searching ? (
          <>
            <span className="font-semibold text-neutral-900">{visible.length}</span> of {requests.length}{" "}
            {requests.length === 1 ? "request" : "requests"}
          </>
        ) : (
          <>
            <span className="font-semibold text-neutral-900">{requests.length}</span>{" "}
            {requests.length === 1 ? "request" : "requests"}
          </>
        )}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
          No requests match that search.
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((request) => (
            <li key={request.id} className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
              <p className="text-right text-sm text-neutral-500">
                <LocalTime iso={request.createdAt} />
              </p>
              <Field label="Restaurant or business" value={request.business} />
              <Field label="Role" value={request.role} />
              <Field label="City" value={request.city} />
              <Field label="Your email" value={request.email} href={`mailto:${request.email}`} />
              <Field label="Pay (optional)" value={request.pay} />
              <Field label="Job description" value={request.description} />
              <Field label="What’s it actually like? (optional)" value={request.about} />
              <Field label="How should chefs apply?" value={request.apply} />
              <form action={saveJobRequestNotesAction} className="mt-4 border-t border-neutral-200 pt-4">
                <input type="hidden" name="id" value={request.id} />
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Notes</span>
                  <span className="mt-0.5 block text-xs text-neutral-400">Only you see this.</span>
                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={5000}
                    defaultValue={request.notes}
                    placeholder="Add a note for yourself"
                    className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
                  />
                </label>
                <div className="mt-2">
                  <SaveNotesButton />
                </div>
              </form>
              <div className="mt-4">
                <DeleteRequest id={request.id} business={request.business} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
