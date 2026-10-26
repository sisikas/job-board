"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ActionStat, AnalyticsReport, NameCount } from "@/lib/ga-report";

type Load =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; report: AnalyticsReport };

function lastDays(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (days - 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function formatTime(seconds: number) {
  if (!seconds) return "0s";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (!minutes) return `${rest}s`;
  return `${minutes}m ${rest}s`;
}

const BAR_COLORS = [
  "#4082a1",
  "#e07a3d",
  "#63912f",
  "#c43d6e",
  "#6b4c9a",
  "#d4a017",
  "#2f6f6f",
  "#c4523a",
  "#3d5a99",
];

function Bars({ rows, total, empty }: { rows: NameCount[]; total: number; empty: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  if (rows.length === 0 || total === 0) {
    return <p className="text-sm text-neutral-500">{empty}</p>;
  }
  const bars = rows.map((row, index) => ({
    label: row.label,
    percent: Math.round((row.users / total) * 100),
    color: BAR_COLORS[index % BAR_COLORS.length],
  }));
  const counted = rows.reduce((sum, row) => sum + row.users, 0);
  if (total > counted) {
    bars.push({
      label: "Other",
      percent: Math.round(((total - counted) / total) * 100),
      color: BAR_COLORS[bars.length % BAR_COLORS.length],
    });
  }

  return (
    <ul className="flex flex-col gap-3">
      {bars.map((bar) => (
        <li
          key={bar.label}
          className="relative"
          onMouseEnter={() => setHovered(bar.label)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(bar.label)}
          onBlur={() => setHovered(null)}
        >
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-medium text-neutral-900">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: bar.color }} />
              {bar.label}
            </span>
            <span className="text-neutral-500">{bar.percent}%</span>
          </div>
          <div
            className="h-3 rounded-full bg-neutral-100"
            role="img"
            aria-label={`${bar.label}, ${bar.percent}%`}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(bar.percent, 100)}%`, background: bar.color }}
            />
          </div>
          {hovered === bar.label && (
            <p className="absolute left-0 top-full z-10 mt-1 rounded-md bg-neutral-900 px-2 py-1 text-xs text-white">
              {bar.label}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function ActionList({ actions, wholeLabel }: { actions: ActionStat[]; wholeLabel: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {actions.map((action) => (
        <li key={action.key} className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-neutral-900">{action.label}</span>
          <span className="text-neutral-600">
            {action.percent}%{" "}
            <span className="text-neutral-400">
              ({action.users} of {wholeLabel})
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsDashboard() {
  const initial = lastDays(7);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [preset, setPreset] = useState<number | null>(7);
  const [excludeGreece, setExcludeGreece] = useState(false);
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ start, end });
    if (excludeGreece) params.set("exclude", "greece");
    fetch(`/api/admin/analytics?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as {
          configured?: boolean;
          report?: AnalyticsReport;
          error?: string;
        };
        if (response.status === 401) {
          setLoad({ status: "error", message: "Log in again." });
          return;
        }
        if (!response.ok) {
          setLoad({ status: "error", message: body.error || "The numbers could not be loaded." });
          return;
        }
        if (!body.configured || !body.report) {
          setLoad({ status: "missing" });
          return;
        }
        setLoad({ status: "ready", report: body.report });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoad({ status: "error", message: "The numbers could not be loaded." });
      });
    return () => controller.abort();
  }, [start, end, excludeGreece]);

  function applyPreset(days: number) {
    const range = lastDays(days);
    setPreset(days);
    setStart(range.start);
    setEnd(range.end);
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex w-fit items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900">
        <input
          type="checkbox"
          checked={excludeGreece}
          onChange={(event) => setExcludeGreece(event.target.checked)}
          className="h-4 w-4 accent-[var(--brand-brick)]"
        />
        Exclude Greece
      </label>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            [3, "Past 3 days"],
            [7, "Past 7 days"],
            [28, "Past 28 days"],
          ].map(([days, label]) => (
            <button
              key={days}
              type="button"
              onClick={() => applyPreset(Number(days))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={
                preset === days
                  ? { background: "var(--brand-brick)", color: "white" }
                  : { background: "white", color: "#404040", border: "1px solid #d4d4d4" }
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <label className="flex items-center gap-2">
            From
            <input
              type="date"
              value={start}
              max={end}
              onChange={(event) => {
                setPreset(null);
                setStart(event.target.value);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5"
            />
          </label>
          <label className="flex items-center gap-2">
            to
            <input
              type="date"
              value={end}
              min={start}
              onChange={(event) => {
                setPreset(null);
                setEnd(event.target.value);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5"
            />
          </label>
        </div>
      </div>

      {load.status === "loading" && <p className="text-sm text-neutral-500">Loading the numbers…</p>}
      {load.status === "error" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {load.message}
        </p>
      )}
      {load.status === "missing" && <SetupHelp />}
      {load.status === "ready" && <ReportView report={load.report} />}
    </div>
  );
}

function ReportView({ report }: { report: AnalyticsReport }) {
  const visitors = String(report.visitors);
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Visitors" value={visitors} />
        <Stat label="Left almost immediately" value={`${report.bouncePercent}%`} />
        <Stat label="Average time on the site" value={formatTime(report.averageSeconds)} />
        {report.actions.map((action) => (
          <Stat
            key={action.key}
            label={action.label}
            value={`${action.percent}%`}
            detail={`${action.users} of ${visitors}`}
          />
        ))}
        <Stat
          label="No action or bounced after hitting the wall"
          value={report.welcomeSearch.error ? "—" : `${report.welcomeSearch.percent}%`}
          detail={
            report.welcomeSearch.error
              ? report.welcomeSearch.error
              : `${report.welcomeSearch.users} of ${visitors} visitors searched, then left or did nothing`
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Where they came from">
          <Bars rows={report.sources} total={report.visitors} empty="No visits in these dates yet." />
        </Panel>
        <Panel title="Which country">
          <Bars rows={report.countries} total={report.visitors} empty="No visits in these dates yet." />
        </Panel>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-base font-semibold text-neutral-900">People who signed up</h2>
        <p className={`mt-1 text-sm ${report.signups.error ? "text-red-700" : "text-neutral-500"}`}>
          {report.signups.error
            ? report.signups.error
            : report.signups.users === 0
              ? "Nobody signed up in these dates."
              : `${report.signups.users} ${report.signups.users === 1 ? "person" : "people"} signed up and stayed ${formatTime(report.signups.averageSeconds)} on average.`}
        </p>
        {report.signups.users > 0 && (
          <div className="mt-4">
            <ActionList actions={report.signups.actions} wholeLabel="sign-ups" />
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-neutral-400">{detail}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-neutral-900">{title}</h2>
      {children}
    </div>
  );
}

function SetupHelp() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
      <p className="font-semibold text-neutral-900">Google Analytics is not connected to this page yet.</p>
      <p className="mt-2">
        The site is already sending visits. Reading them back needs a key from Google. Add these three
        values to the server, then reload this page.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5">
        <li>
          In Google Cloud, create a project, turn on the Google Analytics Data API, and create a service
          account. Download its JSON key.
        </li>
        <li>
          In Google Analytics, open Admin, then Property access management, and add that service account
          email as a Viewer.
        </li>
        <li>
          In Admin, then Property settings, copy the Property ID. It is a number, not the G- measurement ID.
        </li>
        <li>
          Set <code>GA_PROPERTY_ID</code>, <code>GA_CLIENT_EMAIL</code>, and <code>GA_PRIVATE_KEY</code> on
          the server. Keep the private key out of chat.
        </li>
      </ol>
    </div>
  );
}
