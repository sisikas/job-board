"use client";

import { useMemo, useState } from "react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { LocalTime } from "@/components/LocalTime";

export type SignupItem = {
  email: string;
  createdAt: string;
  inLastWeek: boolean;
};

export function SignupList({ signups }: { signups: SignupItem[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return signups;
    return signups.filter((signup) => signup.email.toLowerCase().includes(q));
  }, [signups, query]);
  const searching = query.trim().length > 0;
  const thisWeek = signups.filter((signup) => signup.inLastWeek).length;

  return (
    <>
      <label className="mb-4 block">
        <span className="sr-only">Search sign-ups</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
        />
      </label>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          {searching ? (
            <>
              <span className="font-semibold text-neutral-900">{visible.length}</span> of {signups.length}{" "}
              {signups.length === 1 ? "account" : "accounts"}
            </>
          ) : (
            <>
              <span className="font-semibold text-neutral-900">{signups.length}</span>{" "}
              {signups.length === 1 ? "account" : "accounts"} in total &middot;{" "}
              <span className="font-semibold text-neutral-900">{thisWeek}</span> in the last 7 days
            </>
          )}
        </p>
        <a
          href="/api/admin/signups"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
        >
          Download CSV
        </a>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
          No sign-ups match that search.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {visible.map((signup) => (
            <li key={signup.email} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <a href={`mailto:${signup.email}`} className="font-medium text-neutral-900 hover:underline">
                  {signup.email}
                </a>
                <span className="text-sm text-neutral-500">
                  <LocalTime iso={signup.createdAt} />
                </span>
              </div>
              <div className="mt-2">
                <ConfirmDelete email={signup.email} kind="signup" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
