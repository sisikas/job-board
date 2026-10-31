"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Job } from "@/lib/jobs";
import { todayISODate } from "@/lib/format";
import { COUNTRIES } from "@/lib/countries";
import { SuggestInput } from "@/components/SuggestInput";

type DraftJob = Omit<Job, "id" | "postedAt"> & { id?: string; postedAt?: string };

type ColumnFilters = {
  role: string;
  venue: string;
  city: string;
  country: string;
  description: string;
  applyContact: string;
  instagramUrl: string;
  postedAt: string;
};

function emptyFilters(): ColumnFilters {
  return {
    role: "",
    venue: "",
    city: "",
    country: "",
    description: "",
    applyContact: "",
    instagramUrl: "",
    postedAt: "",
  };
}

function matchesFilter(value: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (value || "").toLowerCase().includes(q);
}

function ColumnSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search…"
      className="block w-full min-w-28 rounded border border-neutral-200 px-2 py-1 text-xs font-normal text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
    />
  );
}

function ColumnHeader({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  return (
    <th className="px-4 py-3 font-medium align-top whitespace-normal">
      <div className="flex flex-col items-stretch gap-1.5">
        <span>{label}</span>
        {children}
      </div>
    </th>
  );
}

function blankDraft(): DraftJob {
  return {
    role: "",
    venue: "",
    city: "",
    country: "",
    description: "",
    applyMethod: "text",
    applyContact: "",
    instagramUrl: "",
    status: "open",
    postedAt: todayISODate(),
  };
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [newJob, setNewJob] = useState<DraftJob>(blankDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(emptyFilters);
  const [menuJob, setMenuJob] = useState<Job | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function loadJobs() {
    setLoading(true);
    const res = await fetch("/api/jobs?admin=1");
    if (res.status === 401) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setJobs(data.jobs);
    setAuthed(true);
    setLoading(false);
  }

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!menuJob) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuJob(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuJob]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginError("Wrong password.");
      return;
    }
    setPassword("");
    loadJobs();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setJobs([]);
  }

  function startEdit(job: Job) {
    setMenuJob(null);
    setError("");
    setNewJob({ ...job });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setError("");
    setNewJob(blankDraft());
  }

  async function handleSave() {
    setError("");
    if (!newJob.role || !newJob.venue || !newJob.city) {
      setError("Role, venue and city are required.");
      return;
    }
    const editing = Boolean(newJob.id);
    setSaving(true);
    const res = await fetch(editing ? `/api/jobs/${newJob.id}` : "/api/jobs", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newJob),
    });
    setSaving(false);
    if (!res.ok) {
      setError(editing ? "Could not save changes." : "Could not create posting.");
      return;
    }
    setNewJob(blankDraft());
    loadJobs();
  }

  async function handleDelete(id: string) {
    setMenuJob(null);
    if (!confirm("Delete this posting? This can't be undone.")) return;
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete posting.");
      return;
    }
    if (newJob.id === id) setNewJob(blankDraft());
    loadJobs();
  }

  const usedCities = useMemo(() => {
    return Array.from(
      new Set(jobs.map((j) => j.city.trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const usedCountries = useMemo(() => {
    return Array.from(
      new Set(jobs.map((j) => j.country.trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const cityOptions = useMemo(() => {
    const selected = newJob.country.trim().toLowerCase();
    if (!selected) return usedCities;
    const inCountry = jobs
      .filter((j) => j.country.trim().toLowerCase() === selected)
      .map((j) => j.city.trim())
      .filter(Boolean);
    const uniqueInCountry = Array.from(new Set(inCountry)).sort((a, b) =>
      a.localeCompare(b)
    );
    const rest = usedCities.filter(
      (city) => !uniqueInCountry.some((c) => c.toLowerCase() === city.toLowerCase())
    );
    return [...uniqueInCountry, ...rest];
  }, [jobs, newJob.country, usedCities]);

  const countryOptions = useMemo(() => {
    const rest = COUNTRIES.filter(
      (country) =>
        !usedCountries.some((used) => used.toLowerCase() === country.toLowerCase())
    );
    return [...usedCountries, ...rest];
  }, [usedCountries]);

  const visibleJobs = useMemo(() => {
    return jobs.filter(
      (job) =>
        matchesFilter(job.role, columnFilters.role) &&
        matchesFilter(job.venue, columnFilters.venue) &&
        matchesFilter(job.city, columnFilters.city) &&
        matchesFilter(job.country, columnFilters.country) &&
        matchesFilter(job.description, columnFilters.description) &&
        matchesFilter(job.applyContact, columnFilters.applyContact) &&
        matchesFilter(job.instagramUrl, columnFilters.instagramUrl) &&
        matchesFilter(job.postedAt, columnFilters.postedAt)
    );
  }, [jobs, columnFilters]);

  function setColumnFilter(field: keyof ColumnFilters, value: string) {
    setColumnFilters((prev) => ({ ...prev, [field]: value }));
  }

  if (authed === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Loading&hellip;</p>
      </div>
    );
  }

  if (authed === false) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-50 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-neutral-900">
            Admin login
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter the admin password to manage job postings.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="mt-4 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          {loginError && (
            <p className="mt-2 text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
          >
            Log in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              Manage job postings
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Add, edit, or remove postings. Changes appear on
              the public page immediately.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/analytics"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Visits
            </Link>
            <Link
              href="/admin/signups"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Sign-ups
            </Link>
            <Link
              href="/admin/onboarding"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Onboarding
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Add new posting */}
        <form
          ref={formRef}
          onSubmit={(e) => e.preventDefault()}
          className="mb-8 scroll-mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">
            {newJob.id ? "Edit posting" : "Add a new posting"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              placeholder="Role *"
              value={newJob.role}
              onChange={(e) => setNewJob({ ...newJob, role: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <input
              placeholder="Venue / company *"
              value={newJob.venue}
              onChange={(e) => setNewJob({ ...newJob, venue: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <SuggestInput
              placeholder="City *"
              value={newJob.city}
              onChange={(city) => setNewJob({ ...newJob, city })}
              options={cityOptions}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <SuggestInput
              placeholder="Country"
              value={newJob.country}
              onChange={(country) => setNewJob({ ...newJob, country })}
              options={countryOptions}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <input
              placeholder="Ways to apply"
              value={newJob.applyContact}
              onChange={(e) =>
                setNewJob({ ...newJob, applyContact: e.target.value })
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 sm:col-span-2"
            />
            <input
              placeholder="Instagram Business URL"
              value={newJob.instagramUrl}
              onChange={(e) =>
                setNewJob({ ...newJob, instagramUrl: e.target.value })
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 sm:col-span-2"
            />
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500">Posted date</span>
              <input
                type="date"
                value={newJob.postedAt || ""}
                onChange={(e) =>
                  setNewJob({ ...newJob, postedAt: e.target.value })
                }
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </label>
            <textarea
              placeholder="Brief description"
              value={newJob.description}
              onChange={(e) =>
                setNewJob({ ...newJob, description: e.target.value })
              }
              rows={2}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 sm:col-span-2 lg:col-span-3"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : newJob.id ? "Save changes" : "Add posting"}
            </button>
            {newJob.id && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Existing postings table — wide enough for full values; scroll sideways for the rest */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-max text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <ColumnHeader label="Role">
                  <ColumnSearch
                    value={columnFilters.role}
                    onChange={(value) => setColumnFilter("role", value)}
                  />
                </ColumnHeader>
                <ColumnHeader label="Venue">
                  <ColumnSearch
                    value={columnFilters.venue}
                    onChange={(value) => setColumnFilter("venue", value)}
                  />
                </ColumnHeader>
                <ColumnHeader label="City">
                  <ColumnSearch
                    value={columnFilters.city}
                    onChange={(value) => setColumnFilter("city", value)}
                  />
                </ColumnHeader>
                <ColumnHeader label="Country">
                  <ColumnSearch
                    value={columnFilters.country}
                    onChange={(value) => setColumnFilter("country", value)}
                  />
                </ColumnHeader>
                <ColumnHeader label="Description">
                  <ColumnSearch
                    value={columnFilters.description}
                    onChange={(value) => setColumnFilter("description", value)}
                  />
                </ColumnHeader>
                <ColumnHeader label="Ways to apply">
                  <ColumnSearch
                    value={columnFilters.applyContact}
                    onChange={(value) => setColumnFilter("applyContact", value)}
                  />
                </ColumnHeader>
                <ColumnHeader label="Instagram Business URL">
                  <ColumnSearch
                    value={columnFilters.instagramUrl}
                    onChange={(value) => setColumnFilter("instagramUrl", value)}
                  />
                </ColumnHeader>
                <ColumnHeader label="Posted date">
                  <ColumnSearch
                    value={columnFilters.postedAt}
                    onChange={(value) => setColumnFilter("postedAt", value)}
                  />
                </ColumnHeader>
              </tr>
            </thead>
            <tbody>
              {visibleJobs.map((job) => (
                <tr
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${job.role}, ${job.venue}`}
                  onClick={() => setMenuJob(job)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMenuJob(job);
                    }
                  }}
                  className={
                    "border-b border-neutral-100 last:border-0 whitespace-nowrap cursor-pointer hover:bg-neutral-50 " +
                    (newJob.id === job.id || menuJob?.id === job.id ? "bg-neutral-50" : "")
                  }
                >
                  <td className="px-4 py-3">{job.role}</td>
                  <td className="px-4 py-3">{job.venue}</td>
                  <td className="px-4 py-3">{job.city}</td>
                  <td className="px-4 py-3">{job.country}</td>
                  <td className="px-4 py-3">
                    <span className="block max-w-xs truncate" title={job.description}>
                      {job.description}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block max-w-xs truncate" title={job.applyContact}>
                      {job.applyContact}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block max-w-xs truncate" title={job.instagramUrl}>
                      {job.instagramUrl}
                    </span>
                  </td>
                  <td className="px-4 py-3">{job.postedAt}</td>
                </tr>
              ))}
              {!loading && jobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-400">
                    No postings yet — add one above.
                  </td>
                </tr>
              )}
              {!loading && jobs.length > 0 && visibleJobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-400">
                    No postings match these column searches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {menuJob && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(33, 28, 20, 0.5)" }}
            onClick={() => setMenuJob(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${menuJob.role} at ${menuJob.venue}`}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-neutral-900">{menuJob.role}</p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {menuJob.venue}
                    {menuJob.city ? ` · ${menuJob.city}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuJob(null)}
                  aria-label="Close"
                  className="shrink-0 text-xl leading-none text-neutral-400 hover:text-neutral-900"
                >
                  &times;
                </button>
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(menuJob)}
                  className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(menuJob.id)}
                  className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
