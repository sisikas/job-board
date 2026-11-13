"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { EmailBusiness } from "@/lib/email-businesses";

type Draft = {
  id?: string;
  business: string;
  city: string;
  email: string;
  status: string;
  notes: string;
};

type ColumnFilters = {
  business: string;
  city: string;
  email: string;
  status: string;
  notes: string;
};

function emptyFilters(): ColumnFilters {
  return { business: "", city: "", email: "", status: "", notes: "" };
}

function blankDraft(): Draft {
  return { business: "", city: "", email: "", status: "", notes: "" };
}

function matchesFilter(value: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (value || "").toLowerCase().includes(q);
}

function ColumnSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
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

function ColumnHeader({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <th className="px-4 py-3 font-medium align-top whitespace-normal">
      <div className="flex flex-col items-stretch gap-1.5">
        <span>{label}</span>
        {children}
      </div>
    </th>
  );
}

const fieldClass =
  "rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";

export function EmailBusinesses() {
  const [businesses, setBusinesses] = useState<EmailBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(emptyFilters);
  const [menu, setMenu] = useState<EmailBusiness | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/email-businesses");
    if (!res.ok) {
      setError("The list could not be loaded.");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { businesses: EmailBusiness[] };
    setBusinesses(data.businesses);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  function startEdit(business: EmailBusiness) {
    setMenu(null);
    setError("");
    setDraft({ ...business });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setError("");
    setDraft(blankDraft());
  }

  async function handleSave() {
    setError("");
    if (!draft.business.trim() || !draft.email.trim()) {
      setError("Business name and email address are required.");
      return;
    }
    const editing = Boolean(draft.id);
    setSaving(true);
    const res = await fetch(editing ? `/api/admin/email-businesses/${draft.id}` : "/api/admin/email-businesses", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || (editing ? "Could not save changes." : "Could not add the business."));
      return;
    }
    setDraft(blankDraft());
    load();
  }

  async function handleDelete(id: string) {
    setMenu(null);
    if (!confirm("Delete this business? This can't be undone.")) return;
    const res = await fetch(`/api/admin/email-businesses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not delete the business.");
      return;
    }
    if (draft.id === id) setDraft(blankDraft());
    load();
  }

  const visible = useMemo(() => {
    return businesses.filter(
      (row) =>
        matchesFilter(row.business, columnFilters.business) &&
        matchesFilter(row.city, columnFilters.city) &&
        matchesFilter(row.email, columnFilters.email) &&
        matchesFilter(row.status, columnFilters.status) &&
        matchesFilter(row.notes, columnFilters.notes)
    );
  }, [businesses, columnFilters]);

  function setColumnFilter(field: keyof ColumnFilters, value: string) {
    setColumnFilters((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <form
        ref={formRef}
        onSubmit={(event) => event.preventDefault()}
        className="mb-8 scroll-mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          {draft.id ? "Edit business" : "Add a business"}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">Business name</span>
            <input
              placeholder="Business name *"
              value={draft.business}
              onChange={(event) => setDraft({ ...draft, business: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">City</span>
            <input
              placeholder="City"
              value={draft.city}
              onChange={(event) => setDraft({ ...draft, city: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">Email address</span>
            <input
              type="email"
              placeholder="Email address *"
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">Status</span>
            <input
              placeholder="Status"
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <span className="text-xs text-neutral-500">Notes</span>
            <textarea
              placeholder="Notes"
              value={draft.notes}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              rows={2}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : draft.id ? "Save changes" : "Add business"}
          </button>
          {draft.id && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-max text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <ColumnHeader label="Business name">
                <ColumnSearch value={columnFilters.business} onChange={(value) => setColumnFilter("business", value)} />
              </ColumnHeader>
              <ColumnHeader label="City">
                <ColumnSearch value={columnFilters.city} onChange={(value) => setColumnFilter("city", value)} />
              </ColumnHeader>
              <ColumnHeader label="Email address">
                <ColumnSearch value={columnFilters.email} onChange={(value) => setColumnFilter("email", value)} />
              </ColumnHeader>
              <ColumnHeader label="Status">
                <ColumnSearch value={columnFilters.status} onChange={(value) => setColumnFilter("status", value)} />
              </ColumnHeader>
              <ColumnHeader label="Notes">
                <ColumnSearch value={columnFilters.notes} onChange={(value) => setColumnFilter("notes", value)} />
              </ColumnHeader>
              <th className="px-4 py-3 font-medium align-top"> </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.id}
                role="button"
                tabIndex={0}
                aria-label={`${row.business}, ${row.email}`}
                onClick={() => setMenu(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setMenu(row);
                  }
                }}
                className={
                  "cursor-pointer border-b border-neutral-100 whitespace-nowrap last:border-0 hover:bg-neutral-50 " +
                  (draft.id === row.id || menu?.id === row.id ? "bg-neutral-50" : "")
                }
              >
                <td className="px-4 py-3">{row.business}</td>
                <td className="px-4 py-3">{row.city}</td>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  <span className="block max-w-xs truncate" title={row.notes}>
                    {row.notes}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEdit(row);
                      }}
                      className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(row.id);
                      }}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && businesses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  No businesses yet — add one above.
                </td>
              </tr>
            )}
            {!loading && businesses.length > 0 && visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  No businesses match these column searches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {menu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(33, 28, 20, 0.5)" }}
          onClick={() => setMenu(null)}
          role="dialog"
          aria-modal="true"
          aria-label={menu.business}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-neutral-900">{menu.business}</p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {menu.email}
                  {menu.city ? ` · ${menu.city}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMenu(null)}
                aria-label="Close"
                className="shrink-0 text-xl leading-none text-neutral-400 hover:text-neutral-900"
              >
                &times;
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => startEdit(menu)}
                className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDelete(menu.id)}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
