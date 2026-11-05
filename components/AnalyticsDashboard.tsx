"use client";

import { useEffect, useState, type ReactNode } from "react";
import type {
  AnalyticsReport,
  CountStat,
  NameCount,
  ReturnVisit,
  TrendPoint,
  TrendUnit,
} from "@/lib/ga-report";

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
      <TrendChart
        points={visitors.trend}
        unit={report.trendUnit}
        noun="visitor"
        error={visitors.trendError}
      />
      <ReturnChart rows={visitors.returns} error={visitors.returnsError} />
      <AlertClicks rows={visitors.alertClicks} error={visitors.alertClicksError} />
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
      <TrendChart
        points={users.trend}
        unit={report.trendUnit}
        noun="user"
        error={users.trendError}
      />
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

function trendCopy(unit: TrendUnit, noun: "visitor" | "user") {
  const people = noun === "visitor" ? "came" : "signed up";
  const when = unit === "hour" ? "hour" : "day";
  const title = noun === "visitor" ? `Visitors each ${when}` : "New Sign ups";
  return { title, caption: `Each point is how many people ${people} that ${when}.` };
}

function axisIndexes(count: number): number[] {
  if (count <= 1) return [0];
  const target = count <= 8 ? count : 6;
  const indexes = new Set<number>();
  for (let step = 0; step < target; step += 1) {
    indexes.add(Math.round((step * (count - 1)) / (target - 1)));
  }
  return [...indexes];
}

function TrendChart({
  points,
  unit,
  noun,
  error,
}: {
  points?: TrendPoint[];
  unit: TrendUnit;
  noun: "visitor" | "user";
  error?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const list = points ?? [];
  const copy = trendCopy(unit, noun);
  const width = 640;
  const height = 220;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 32;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const peak = list.reduce((highest, point) => Math.max(highest, point.count), 0);
  const scale = Math.max(peak, 1);
  const ticks = [...new Set(peak <= 1 ? [0, scale] : [0, Math.round(peak / 2), peak])];
  const xAt = (index: number) =>
    list.length <= 1 ? padLeft + plotWidth / 2 : padLeft + (index / (list.length - 1)) * plotWidth;
  const yAt = (count: number) => padTop + plotHeight - (count / scale) * plotHeight;
  const line = list
    .map((point, index) => `${index === 0 ? "M" : "L"}${xAt(index).toFixed(1)},${yAt(point.count).toFixed(1)}`)
    .join(" ");
  const area =
    list.length > 1
      ? `${line} L${xAt(list.length - 1).toFixed(1)},${(padTop + plotHeight).toFixed(1)} L${xAt(0).toFixed(1)},${(padTop + plotHeight).toFixed(1)} Z`
      : "";
  const labels = new Set(axisIndexes(list.length));
  const active = hover !== null ? list[hover] : undefined;
  const people =
    active === undefined
      ? ""
      : `${active.count} ${active.count === 1 ? noun : `${noun}s`}`;

  return (
    <Panel title={copy.title}>
      <p className="mb-4 text-sm" style={{ color: PINK_MUTED }}>
        {copy.caption}
      </p>
      {error ? (
        <p className="text-sm" style={{ color: "#9b2c4a" }}>
          {error}
        </p>
      ) : list.length === 0 ? (
        <p className="text-sm" style={{ color: PINK_MUTED }}>
          No dates in this range.
        </p>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            role="img"
            aria-label={`${copy.title}. The highest point is ${peak}.`}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                  stroke="#f3c6d4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={yAt(tick) + 4}
                  textAnchor="end"
                  fill="#a06a80"
                  fontSize="11"
                >
                  {tick}
                </text>
              </g>
            ))}
            {area && <path d={area} fill="#e56b96" opacity="0.16" />}
            {list.length > 1 && (
              <path d={line} fill="none" stroke="#e56b96" strokeWidth="2.5" strokeLinejoin="round" />
            )}
            {list.length <= 31 &&
              list.map((point, index) => (
                <circle
                  key={`${point.title}-dot`}
                  cx={xAt(index)}
                  cy={yAt(point.count)}
                  r={hover === index ? 5 : 3.5}
                  fill={hover === index ? "#7a2e4a" : "#e56b96"}
                />
              ))}
            {hover !== null && (
              <line
                x1={xAt(hover)}
                x2={xAt(hover)}
                y1={padTop}
                y2={padTop + plotHeight}
                stroke="#7a2e4a"
                strokeDasharray="3 3"
              />
            )}
            {list.map((point, index) => {
              const left = index === 0 ? padLeft : (xAt(index - 1) + xAt(index)) / 2;
              const right = index === list.length - 1 ? width - padRight : (xAt(index) + xAt(index + 1)) / 2;
              return (
                <rect
                  key={`${point.title}-hit`}
                  x={left}
                  y={padTop}
                  width={Math.max(right - left, 1)}
                  height={plotHeight}
                  fill="transparent"
                  onPointerEnter={() => setHover(index)}
                />
              );
            })}
            {list.map((point, index) =>
              labels.has(index) ? (
                <text
                  key={`${point.title}-label`}
                  x={xAt(index)}
                  y={height - 8}
                  textAnchor={index === 0 ? "start" : index === list.length - 1 ? "end" : "middle"}
                  fill="#a06a80"
                  fontSize="11"
                >
                  {point.label}
                </text>
              ) : null
            )}
          </svg>
          {active && hover !== null && (
            <p
              className="pointer-events-none absolute z-10 rounded-full px-2.5 py-1 text-xs whitespace-nowrap text-white"
              style={{
                left: `${(xAt(hover) / width) * 100}%`,
                top: `${(yAt(active.count) / height) * 100}%`,
                transform:
                  yAt(active.count) < 48
                    ? "translate(-50%, 8px)"
                    : "translate(-50%, calc(-100% - 8px))",
                background: PINK_DEEP,
              }}
            >
              {active.title}: {people}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

function visitsEachLabel(value: number) {
  if (!value) return "no visits in these dates";
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 1) return "1 visit each";
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} visits each`;
}

function ReturnChart({ rows, error }: { rows?: ReturnVisit[]; error?: string }) {
  const list = rows ?? [];
  const peak = list.reduce((highest, row) => Math.max(highest, row.people), 0);
  return (
    <Panel title="Who came back">
      <p className="mb-4 text-sm" style={{ color: PINK_MUTED }}>
        First visit means they had never been here. Came back means they had. Visits each is how
        often they opened the site in these dates.
      </p>
      {error ? (
        <p className="text-sm" style={{ color: "#9b2c4a" }}>
          {error}
        </p>
      ) : peak === 0 ? (
        <p className="text-sm" style={{ color: PINK_MUTED }}>
          No visits in these dates yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((row) => {
            const width = Math.round((row.people / peak) * 100);
            const people = `${row.people} ${row.people === 1 ? "person" : "people"}`;
            const detail = `${people}, ${visitsEachLabel(row.visitsEach)}`;
            return (
              <li key={row.label}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                  <span className="font-medium" style={{ color: PINK_DEEP }}>
                    {row.label}
                  </span>
                  <span style={{ color: PINK_MUTED }}>{detail}</span>
                </div>
                <div
                  className="h-3 rounded-full"
                  style={{ background: "#fde8ef" }}
                  role="img"
                  aria-label={`${row.label}, ${detail}`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      background: row.label === "Came back" ? PINK : "#f0a36a",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function AlertClicks({ rows, error }: { rows?: NameCount[]; error?: string }) {
  const list = (rows ?? []).filter((row) => row.users > 0 && row.label !== "Unknown");
  const peak = list.reduce((highest, row) => Math.max(highest, row.users), 0);
  return (
    <Panel title="Opened from an alert">
      <p className="mb-4 text-sm" style={{ color: PINK_MUTED }}>
        People who clicked a job in an alert email. Each bar is the role on that link.
      </p>
      {error ? (
        <p className="text-sm" style={{ color: "#9b2c4a" }}>
          {error}
        </p>
      ) : peak === 0 ? (
        <p className="text-sm" style={{ color: PINK_MUTED }}>
          No one has opened a job from an alert in these dates.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((row) => {
            const width = Math.round((row.users / peak) * 100);
            const people = `${row.users} ${row.users === 1 ? "person" : "people"}`;
            return (
              <li key={row.label}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
                  <span className="font-medium" style={{ color: PINK_DEEP }}>
                    {row.label}
                  </span>
                  <span style={{ color: PINK_MUTED }}>{people}</span>
                </div>
                <div
                  className="h-3 rounded-full"
                  style={{ background: "#fde8ef" }}
                  role="img"
                  aria-label={`${row.label}, ${people}`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${width}%`, background: PINK }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
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
