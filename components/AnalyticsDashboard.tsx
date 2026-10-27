"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { AnalyticsReport, CountStat, NameCount } from "@/lib/ga-report";

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

const PINK = "#e56b96";
const PINK_DEEP = "#7a2e4a";
const PINK_SOFT = "#fff7fa";
const PINK_LINE = "#f3c6d4";
const PINK_MUTED = "#a06a80";

const BAR_COLORS = [
  "#e56b96",
  "#f0a36a",
  "#c43d78",
  "#f2b6c8",
  "#8e4a78",
  "#e8896a",
  "#d4a0c0",
  "#a33d5c",
  "#f6d0a8",
];

function Bars({ rows, total, empty }: { rows: NameCount[]; total: number; empty: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  if (rows.length === 0 || total === 0) {
    return (
      <p className="text-sm" style={{ color: PINK_MUTED }}>
        {empty}
      </p>
    );
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
            <span className="flex min-w-0 items-center gap-2 font-medium" style={{ color: PINK_DEEP }}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: bar.color }} />
              {bar.label}
            </span>
            <span style={{ color: PINK_MUTED }}>{bar.percent}%</span>
          </div>
          <div
            className="h-3 rounded-full"
            style={{ background: "#fde8ef" }}
            role="img"
            aria-label={`${bar.label}, ${bar.percent}%`}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(bar.percent, 100)}%`, background: bar.color }}
            />
          </div>
          {hovered === bar.label && (
            <p
              className="absolute left-0 top-full z-10 mt-1 rounded-full px-2.5 py-1 text-xs text-white"
              style={{ background: PINK_DEEP }}
            >
              {bar.label}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsDashboard() {
  const initial = lastDays(7);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [preset, setPreset] = useState<number | "24h" | null>(7);
  const [excludeGreece, setExcludeGreece] = useState(false);
  const [tab, setTab] = useState<"visitors" | "users">("visitors");
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ start, end });
    if (excludeGreece) params.set("exclude", "greece");
    if (preset === "24h") params.set("window", "24h");
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
  }, [start, end, excludeGreece, preset]);

  function applyPreset(days: number | "24h") {
    if (days === "24h") {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      setPreset("24h");
      setStart(startDate.toISOString().slice(0, 10));
      setEnd(endDate.toISOString().slice(0, 10));
      return;
    }
    const range = lastDays(days);
    setPreset(days);
    setStart(range.start);
    setEnd(range.end);
  }

  return (
    <div className="flex flex-col gap-6">
      <label
        className="flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
        style={{ background: "white", color: PINK_DEEP, border: `1px solid ${PINK_LINE}` }}
      >
        <input
          type="checkbox"
          checked={excludeGreece}
          onChange={(event) => setExcludeGreece(event.target.checked)}
          className="h-4 w-4"
          style={{ accentColor: PINK }}
        />
        Exclude Greece
      </label>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["24h", "Last day"],
              [3, "Past 3 days"],
              [7, "Past 7 days"],
              [28, "Past 28 days"],
            ] as const
          ).map(([days, label]) => (
            <button
              key={days}
              type="button"
              onClick={() => applyPreset(days)}
              className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
              style={
                preset === days
                  ? { background: PINK, color: "white" }
                  : { background: "white", color: PINK_DEEP, border: `1px solid ${PINK_LINE}` }
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: PINK_MUTED }}>
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
              className="rounded-full bg-white px-3 py-1.5"
              style={{ border: `1px solid ${PINK_LINE}`, color: PINK_DEEP }}
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
              className="rounded-full bg-white px-3 py-1.5"
              style={{ border: `1px solid ${PINK_LINE}`, color: PINK_DEEP }}
            />
          </label>
        </div>
      </div>

      <div className="flex gap-1" style={{ borderBottom: `1px solid ${PINK_LINE}` }} role="tablist">
        {(
          [
            ["visitors", "Visitors"],
            ["users", "Users"],
          ] as const
        ).map(([id, label]) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(id)}
              className="rounded-t-2xl px-5 py-2 text-sm font-medium"
              style={
                selected
                  ? {
                      background: "white",
                      color: PINK_DEEP,
                      border: `1px solid ${PINK_LINE}`,
                      borderBottomColor: "white",
                      marginBottom: "-1px",
                    }
                  : { color: PINK_MUTED }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {load.status === "loading" && (
        <p className="text-sm" style={{ color: PINK_MUTED }}>
          Loading the numbers…
        </p>
      )}
      {load.status === "error" && (
        <p
          className="rounded-2xl px-4 py-3 text-sm"
          style={{ background: "#fff0f4", color: "#9b2c4a", border: "1px solid #f0b4c4" }}
        >
          {load.message}
        </p>
      )}
      {load.status === "missing" && <SetupHelp />}
      {load.status === "ready" &&
        (tab === "visitors" ? (
          <VisitorsView report={load.report} />
        ) : (
          <UsersView report={load.report} />
        ))}
    </div>
  );
}

function VisitorsView({ report }: { report: AnalyticsReport }) {
  const visitors = report.visitors;
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Visitors" value={String(visitors.count)} />
        <Stat label="Left almost immediately" value={`${visitors.bouncePercent}%`} />
        <CountCard
          label="No action or bounced after hitting the wall"
          stat={visitors.wallLeft}
          whole={visitors.count}
          wholeLabel="visitors"
        />
        <CountCard
          label="Signed up after hitting the wall"
          stat={visitors.wallSignedUp}
          whole={visitors.count}
          wholeLabel="visitors"
        />
        <Stat label="Average time on the site" value={formatTime(visitors.averageSeconds)} />
      </section>
      <PlaceCharts
        sources={visitors.sources}
        countries={visitors.countries}
        total={visitors.count}
        empty="No visits in these dates yet."
      />
    </>
  );
}

function UsersView({ report }: { report: AnalyticsReport }) {
  const users = report.users;
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Users" value={String(users.count)} />
        <Stat
          label="Searched after sign up"
          value={users.searchedAfter.error ? "—" : `${users.searchedAfter.percent}%`}
          detail={
            users.searchedAfter.error
              ? users.searchedAfter.error
              : `${users.searchedAfter.users} of ${users.count} users`
          }
        />
        <Stat label="Average time on the site" value={formatTime(users.averageSeconds)} />
      </section>
      {users.error ? (
        <p
          className="rounded-2xl px-4 py-3 text-sm"
          style={{ background: "#fff0f4", color: "#9b2c4a", border: "1px solid #f0b4c4" }}
        >
          {users.error}
        </p>
      ) : (
        <PlaceCharts
          sources={users.sources}
          countries={users.countries}
          total={users.count}
          empty="Nobody signed up in these dates."
        />
      )}
    </>
  );
}

function CountCard({
  label,
  stat,
  whole,
  wholeLabel,
}: {
  label: string;
  stat: CountStat;
  whole: number;
  wholeLabel: string;
}) {
  return (
    <Stat
      label={label}
      value={stat.error ? "—" : String(stat.users)}
      detail={stat.error ? stat.error : `${stat.percent}% of ${whole} ${wholeLabel}`}
    />
  );
}

function PlaceCharts({
  sources,
  countries,
  total,
  empty,
}: {
  sources: NameCount[];
  countries: NameCount[];
  total: number;
  empty: string;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Panel title="Where they came from">
        <Bars rows={sources} total={total} empty={empty} />
      </Panel>
      <Panel title="Which country">
        <Bars rows={countries} total={total} empty={empty} />
      </Panel>
    </section>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4" style={{ border: `1px solid ${PINK_LINE}` }}>
      <p className="text-sm" style={{ color: PINK_MUTED }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold" style={{ color: PINK_DEEP }}>
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-xs" style={{ color: "#c4899e" }}>
          {detail}
        </p>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: PINK_SOFT, border: `1px solid ${PINK_LINE}` }}>
      <h2 className="mb-4 text-base font-semibold" style={{ color: PINK_DEEP }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function SetupHelp() {
  return (
    <div className="rounded-2xl bg-white p-5 text-sm" style={{ color: PINK_DEEP, border: `1px solid ${PINK_LINE}` }}>
      <p className="font-semibold">Google Analytics is not connected to this page yet.</p>
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
