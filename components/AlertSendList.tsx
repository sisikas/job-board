"use client";

import Link from "next/link";
import { useState } from "react";
import { MarkAlertsSent } from "@/components/MarkAlertsSent";

type SendJob = {
  id: string;
  role: string;
  venue: string;
  place: string;
  adminLabel: string;
};

type SendPerson = {
  id: string;
  email: string;
  lastEmailed: string;
  canClear: boolean;
  roles: string[];
  locations: string[];
  unmatchedPreferences: string[];
  jobs: SendJob[];
};

function pairKey(userId: string, jobId: string) {
  return `${userId}:${jobId}`;
}

function subject(count: number) {
  return count === 1 ? "1 new job for you" : `${count} new jobs for you`;
}

export function AlertSendList({ people, since }: { people: SendPerson[]; since: string | null }) {
  const [leftOut, setLeftOut] = useState<Set<string>>(new Set());

  function included(person: SendPerson) {
    return person.jobs.filter((job) => !leftOut.has(pairKey(person.id, job.id)));
  }

  function toggle(userId: string, jobId: string) {
    const key = pairKey(userId, jobId);
    setLeftOut((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allPairs = people.flatMap((person) =>
    included(person).map((job) => ({ userId: person.id, jobId: job.id }))
  );

  return (
    <div className="border-t border-neutral-100 bg-neutral-50 p-4">
      <p className="mb-3 max-w-2xl text-sm text-neutral-600">
        Every role starts ticked. Untick a role you are leaving out of the email. Only ticked roles
        are marked sent, and the preview email matches that tick.
      </p>
      <MarkAlertsSent
        pairs={allPairs}
        label={`Mark ${allPairs.length} ticked ${allPairs.length === 1 ? "role" : "roles"} as sent`}
        confirm="Mark every ticked role as sent? Unticked roles stay for next time. This does not send the email."
      />
      <ul className="mt-4 space-y-3">
        {people.map((person) => {
          const jobs = included(person);
          const params = new URLSearchParams();
          if (since) params.set("since", since);
          if (jobs.length !== person.jobs.length) params.set("jobs", jobs.map((job) => job.id).join(","));
          const query = params.toString();
          const previewHref = query ? `/admin/alerts/${person.id}?${query}` : `/admin/alerts/${person.id}`;
          return (
            <li key={person.id} className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <a href={`mailto:${person.email}`} className="font-medium text-neutral-900 hover:underline">
                  {person.email}
                </a>
                <span className="flex flex-wrap items-center gap-2 text-neutral-500">
                  {person.lastEmailed}
                  {person.canClear && (
                    <MarkAlertsSent
                      ids={[person.id]}
                      mode="clear"
                      label="Clear"
                      confirm={`Forget every role marked sent for ${person.email}? They can show in the preview again.`}
                    />
                  )}
                </span>
              </div>
              <p className="mt-2 text-neutral-800">Subject: {subject(jobs.length)}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-neutral-500">
                <span>
                  {jobs.length} of {person.jobs.length} {person.jobs.length === 1 ? "role" : "roles"} ticked
                </span>
                {jobs.length > 0 && (
                  <Link
                    href={previewHref}
                    className="inline-flex rounded-full px-3 py-1 text-sm font-bold text-white"
                    style={{ background: "var(--brand-logo-green)" }}
                  >
                    Preview email
                  </Link>
                )}
                <MarkAlertsSent
                  pairs={jobs.map((job) => ({ userId: person.id, jobId: job.id }))}
                  label="Mark ticked as sent"
                  confirm={`Mark the ticked roles for ${person.email} as sent? Unticked roles stay for next time. This does not send the email.`}
                />
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Roles</p>
                    <p className="mt-0.5 text-neutral-800">{person.roles.join(", ") || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Places</p>
                    <p className="mt-0.5 text-neutral-800">{person.locations.join(", ") || "—"}</p>
                  </div>
                  {person.unmatchedPreferences.length > 0 && (
                    <p className="text-amber-800">No job matched: {person.unmatchedPreferences.join(", ")}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Roles in the email</p>
                  <ul className="mt-1 space-y-2">
                    {person.jobs.map((job) => {
                      const ticked = !leftOut.has(pairKey(person.id, job.id));
                      return (
                        <li key={job.id}>
                          <label className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={ticked}
                              onChange={() => toggle(person.id, job.id)}
                            />
                            <span>
                              <Link href={`/jobs/${job.id}`} className="font-medium text-neutral-900 hover:underline">
                                {job.role}
                              </Link>
                              <span className="text-neutral-700"> at {job.venue}</span>
                              <span className="block text-neutral-500">
                                {job.place} · Admin {job.adminLabel}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
