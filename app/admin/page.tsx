"use client";

import { useEffect, useState } from "react";
import type { Job } from "@/lib/jobs";
import { todayISODate } from "@/lib/format";

type DraftJob = Omit<Job, "id" | "postedAt"> & { id?: string; postedAt?: string };

function blankDraft(): DraftJob {
  return {
    role: "",
    venue: "",
    city: "",
    country: "",
    description: "",
    applyMethod: "instagram",
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
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newJob.role || !newJob.venue || !newJob.city) {
      setError("Role, venue and city are required.");
      return;
    }
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newJob),
    });
    if (!res.ok) {
      setError("Could not create posting.");
      return;
    }
    setNewJob(blankDraft());
    loadJobs();
  }

  async function handleUpdate(job: Job) {
    setSavingId(job.id);
    setError("");
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    setSavingId(null);
    if (!res.ok) {
      setError("Could not save changes.");
      return;
    }
    loadJobs();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this posting? This can't be undone.")) return;
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete posting.");
      return;
    }
    loadJobs();
  }

  function updateLocalJob(id: string, field: keyof Job, value: string) {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, [field]: value } : j))
    );
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
              Add, edit, mark filled, or remove postings. Changes appear on
              the public page immediately.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
          >
            Log out
          </button>
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
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">
            Add a new posting
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
            <input
              placeholder="City *"
              value={newJob.city}
              onChange={(e) => setNewJob({ ...newJob, city: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <input
              placeholder="Country"
              value={newJob.country}
              onChange={(e) =>
                setNewJob({ ...newJob, country: e.target.value })
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <select
              value={newJob.applyMethod}
              onChange={(e) =>
                setNewJob({
                  ...newJob,
                  applyMethod: e.target.value as Job["applyMethod"],
                })
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="instagram">Apply via Instagram DM</option>
              <option value="email">Apply via email</option>
              <option value="link">Apply via link</option>
            </select>
            <input
              placeholder={
                newJob.applyMethod === "email"
                  ? "Email address"
                  : newJob.applyMethod === "instagram"
                  ? "Instagram @handle"
                  : "Application URL"
              }
              value={newJob.applyContact}
              onChange={(e) =>
                setNewJob({ ...newJob, applyContact: e.target.value })
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <input
              placeholder="Business Instagram URL"
              value={newJob.instagramUrl}
              onChange={(e) =>
                setNewJob({ ...newJob, instagramUrl: e.target.value })
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <select
              value={newJob.status}
              onChange={(e) =>
                setNewJob({
                  ...newJob,
                  status: e.target.value as Job["status"],
                })
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="open">Open</option>
              <option value="filled">Filled</option>
            </select>
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
          <button
            type="submit"
            className="mt-3 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
          >
            Add posting
          </button>
        </form>

        {/* Existing postings table */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Apply method</th>
                <th className="px-4 py-3 font-medium">Apply contact</th>
                <th className="px-4 py-3 font-medium">Instagram URL</th>
                <th className="px-4 py-3 font-medium">Posted date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2">
                    <input
                      value={job.role}
                      onChange={(e) =>
                        updateLocalJob(job.id, "role", e.target.value)
                      }
                      className="w-full rounded border border-transparent hover:border-neutral-200 focus:border-neutral-400 px-2 py-1 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={job.venue}
                      onChange={(e) =>
                        updateLocalJob(job.id, "venue", e.target.value)
                      }
                      className="w-full rounded border border-transparent hover:border-neutral-200 focus:border-neutral-400 px-2 py-1 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={job.city}
                      onChange={(e) =>
                        updateLocalJob(job.id, "city", e.target.value)
                      }
                      className="w-full rounded border border-transparent hover:border-neutral-200 focus:border-neutral-400 px-2 py-1 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={job.country}
                      onChange={(e) =>
                        updateLocalJob(job.id, "country", e.target.value)
                      }
                      className="w-full rounded border border-transparent hover:border-neutral-200 focus:border-neutral-400 px-2 py-1 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2 min-w-[200px]">
                    <input
                      value={job.description}
                      onChange={(e) =>
                        updateLocalJob(job.id, "description", e.target.value)
                      }
                      className="w-full rounded border border-transparent hover:border-neutral-200 focus:border-neutral-400 px-2 py-1 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={job.applyMethod}
                      onChange={(e) =>
                        updateLocalJob(job.id, "applyMethod", e.target.value)
                      }
                      className="rounded border border-neutral-200 px-2 py-1 text-sm focus:outline-none"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="email">Email</option>
                      <option value="link">Link</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 min-w-[160px]">
                    <input
                      value={job.applyContact}
                      placeholder={
                        job.applyMethod === "email"
                          ? "email address"
                          : job.applyMethod === "instagram"
                          ? "@handle"
                          : "https://..."
                      }
                      onChange={(e) =>
                        updateLocalJob(job.id, "applyContact", e.target.value)
                      }
                      className="w-full rounded border border-transparent hover:border-neutral-200 focus:border-neutral-400 px-2 py-1 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2 min-w-[180px]">
                    <input
                      value={job.instagramUrl || ""}
                      placeholder="https://instagram.com/..."
                      onChange={(e) =>
                        updateLocalJob(job.id, "instagramUrl", e.target.value)
                      }
                      className="w-full rounded border border-transparent hover:border-neutral-200 focus:border-neutral-400 px-2 py-1 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      value={job.postedAt || ""}
                      onChange={(e) =>
                        updateLocalJob(job.id, "postedAt", e.target.value)
                      }
                      className="rounded border border-neutral-200 px-2 py-1 text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={job.status}
                      onChange={(e) =>
                        updateLocalJob(job.id, "status", e.target.value)
                      }
                      className="rounded border border-neutral-200 px-2 py-1 text-sm focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="filled">Filled</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleUpdate(job)}
                      disabled={savingId === job.id}
                      className="text-neutral-900 font-medium hover:underline mr-3 disabled:opacity-50"
                    >
                      {savingId === job.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && jobs.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-neutral-400">
                    No postings yet — add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
