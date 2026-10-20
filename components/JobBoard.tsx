import Link from "next/link";
import type { ReactNode } from "react";
import type { Job } from "@/lib/jobs";
import { formatDate } from "@/lib/format";
import { SignupTeaser } from "@/components/SignupTeaser";

const cardStyle = {
  background: "var(--brand-card)",
  border: "1px solid var(--brand-card-border)",
};

function place(job: Job) {
  return `${job.city}${job.country ? `, ${job.country}` : ""}`;
}

function ResultsSummary({
  count,
  q,
  location,
}: {
  count: number;
  q: string;
  location: string;
}) {
  if (!q && !location) return null;

  return (
    <div className="mb-4 flex items-center justify-between">
      <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
        {count} {count === 1 ? "result" : "results"}
        {q && (
          <>
            {" "}for &ldquo;<span style={{ color: "var(--brand-ink)" }}>{q}</span>&rdquo;
          </>
        )}
        {location && (
          <>
            {" "}in <span style={{ color: "var(--brand-ink)" }}>{location}</span>
          </>
        )}
      </p>
      <Link
        href="/"
        className="text-sm underline underline-offset-2"
        style={{ color: "var(--brand-muted)" }}
      >
        Clear
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl border border-dashed py-16 text-center"
      style={{ borderColor: "var(--brand-input-border)", background: "var(--brand-card)" }}
    >
      <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
        No open positions match your search right now.
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--brand-date)" }}>
        Check back soon, or try a different term.
      </p>
    </div>
  );
}

function CardList({ jobs }: { jobs: Job[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {jobs.map((job) => (
        <li key={job.id}>
          <Link
            href={`/jobs/${job.id}`}
            className="block rounded-2xl p-5 transition-shadow hover:shadow-md"
            style={cardStyle}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--brand-ink)" }}>
                  {job.role}
                </h2>
                <p className="text-sm mt-1 font-semibold" style={{ color: "var(--brand-meta)" }}>
                  {job.venue} &middot;{" "}
                  <span style={{ color: "var(--brand-brick)" }}>{place(job)}</span>
                </p>
              </div>
              <span className="shrink-0 text-xs whitespace-nowrap" style={{ color: "var(--brand-date)" }}>
                {formatDate(job.postedAt)}
              </span>
            </div>

            {job.description && (
              <p
                className="mt-3 text-sm leading-relaxed line-clamp-2"
                style={{ color: "var(--brand-body)" }}
              >
                {job.description}
              </p>
            )}

            <span
              className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white"
              style={{ background: "var(--brand-forest)" }}
            >
              View details &rarr;
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function JobGrid({ jobs, twoColumns }: { jobs: Job[]; twoColumns?: boolean }) {
  return (
    <ul className={`grid grid-cols-2 gap-4 ${twoColumns ? "" : "lg:grid-cols-3"}`}>
      {jobs.map((job) => (
        <li key={job.id}>
          <Link
            href={`/jobs/${job.id}`}
            className="flex h-full flex-col rounded-2xl p-5 transition-shadow hover:shadow-md"
            style={cardStyle}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold leading-snug" style={{ color: "var(--brand-ink)" }}>
                {job.role}
              </h2>
              <span className="shrink-0 pt-1 text-xs whitespace-nowrap" style={{ color: "var(--brand-date)" }}>
                {formatDate(job.postedAt)}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--brand-meta)" }}>
              {job.venue}
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--brand-brick)" }}>
              {place(job)}
            </p>
            {job.description && (
              <p
                className="mt-3 text-sm leading-relaxed line-clamp-2"
                style={{ color: "var(--brand-body)" }}
              >
                {job.description}
              </p>
            )}
            <span className="mt-auto pt-4 text-sm font-bold" style={{ color: "var(--brand-forest)" }}>
              View details &rarr;
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RowList({ jobs }: { jobs: Job[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {jobs.map((job) => (
        <li key={job.id}>
          <Link
            href={`/jobs/${job.id}`}
            className="flex items-center gap-6 rounded-2xl px-5 py-4 transition-shadow hover:shadow-md"
            style={cardStyle}
          >
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold leading-snug" style={{ color: "var(--brand-ink)" }}>
                {job.role}
              </h2>
              <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--brand-meta)" }}>
                {job.venue} &middot;{" "}
                <span style={{ color: "var(--brand-brick)" }}>{place(job)}</span>
              </p>
              {job.description && (
                <p className="mt-1.5 text-sm line-clamp-1" style={{ color: "var(--brand-body)" }}>
                  {job.description}
                </p>
              )}
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <span className="text-xs whitespace-nowrap" style={{ color: "var(--brand-date)" }}>
                {formatDate(job.postedAt)}
              </span>
              <span className="text-sm font-bold whitespace-nowrap" style={{ color: "var(--brand-forest)" }}>
                View &rarr;
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const MOBILE_PREVIEW_COUNT = 3;

const bar = { background: "var(--brand-card-border)" };

function PlaceholderCard() {
  return (
    <div className="flex flex-col rounded-2xl p-5" style={cardStyle}>
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-2/3 rounded-full" style={bar} />
        <div className="h-3 w-14 rounded-full" style={bar} />
      </div>
      <div className="mt-3 h-3.5 w-1/2 rounded-full" style={bar} />
      <div className="mt-2 h-3.5 w-2/5 rounded-full" style={{ background: "var(--brand-brick)", opacity: 0.35 }} />
      <div className="mt-4 h-3 w-full rounded-full" style={bar} />
      <div className="mt-2 h-3 w-4/5 rounded-full" style={bar} />
      <div className="mt-5 h-4 w-24 rounded-full" style={{ background: "var(--brand-forest)", opacity: 0.4 }} />
    </div>
  );
}

function PlaceholderRow() {
  return (
    <div className="flex items-center gap-6 rounded-2xl px-5 py-4" style={cardStyle}>
      <div className="min-w-0 flex-1">
        <div className="h-5 w-1/3 rounded-full" style={bar} />
        <div className="mt-2 h-3.5 w-1/2 rounded-full" style={bar} />
        <div className="mt-2.5 h-3 w-4/5 rounded-full" style={bar} />
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <div className="h-3 w-14 rounded-full" style={bar} />
        <div className="h-3.5 w-12 rounded-full" style={{ background: "var(--brand-forest)", opacity: 0.4 }} />
      </div>
    </div>
  );
}

// Stand-in cards, not real jobs, so hidden postings never reach the page source.
function LockedRows({
  teaser,
  className,
  teaserPosition = "items-center",
  children,
}: {
  teaser: ReactNode;
  className: string;
  teaserPosition?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div aria-hidden="true" className={`${className} blur-[3px] select-none pointer-events-none`}>
        {children}
      </div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, transparent, var(--brand-cream))" }}
      />
      <div className={`absolute inset-0 flex justify-center p-4 ${teaserPosition}`}>
        <div className="w-full max-w-sm rounded-2xl shadow-xl">{teaser}</div>
      </div>
    </div>
  );
}

function repeat(count: number, render: (key: number) => ReactNode) {
  return Array.from({ length: count }, (_, i) => render(i));
}

function HeroBoard({
  jobs,
  signedIn,
  searchRow,
  teaser,
}: {
  jobs: Job[];
  signedIn: boolean;
  searchRow: ReactNode;
  teaser: ReactNode;
}) {
  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="rounded-3xl px-10 py-14 text-center" style={cardStyle}>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight" style={{ color: "var(--brand-ink)" }}>
            Culinary jobs in incredible places
          </h1>
          <p className="mt-3 text-base" style={{ color: "var(--brand-muted)" }}>
            Search by role or location to see current openings.
          </p>
          <div className="mt-8 max-w-3xl mx-auto text-left">{searchRow}</div>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--brand-ink)" }}>
          Latest openings
        </h2>
        {jobs.length === 0 ? <EmptyState /> : <JobGrid jobs={jobs} twoColumns={signedIn} />}
        {teaser && (
          <LockedRows teaser={teaser} className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
            {repeat(6, (i) => <PlaceholderCard key={i} />)}
          </LockedRows>
        )}
      </div>
    </>
  );
}

function SidebarBoard({
  jobs,
  totalCount,
  q,
  location,
  searchStacked,
  teaser,
}: {
  jobs: Job[];
  totalCount: number;
  q: string;
  location: string;
  searchStacked: ReactNode;
  teaser: ReactNode;
}) {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-2 pb-8 grid grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] gap-8 items-start">
      <aside className="sticky top-6 rounded-2xl p-5" style={cardStyle}>
        <p className="mb-4 text-base font-bold" style={{ color: "var(--brand-ink)" }}>
          Refine your search
        </p>
        {searchStacked}
      </aside>
      <div>
        <ResultsSummary count={totalCount} q={q} location={location} />
        {jobs.length === 0 ? <EmptyState /> : <RowList jobs={jobs} />}
        {teaser && (
          <LockedRows teaser={teaser} className="mt-2.5 flex flex-col gap-2.5">
            {repeat(4, (i) => <PlaceholderRow key={i} />)}
          </LockedRows>
        )}
      </div>
    </div>
  );
}

/**
 * For logged-out visitors `jobs` is just the preview: `hiddenCount` is how many
 * search results were held back, and `teaserCount` is the number on the
 * sign-up card shown over blurred stand-ins (0 hides the card).
 */
export function JobBoard({
  jobs,
  q,
  location,
  searchRow,
  searchStacked,
  signedIn,
  hiddenCount = 0,
  teaserCount = 0,
}: {
  jobs: Job[];
  signedIn: boolean;
  q: string;
  location: string;
  searchRow: ReactNode;
  searchStacked: ReactNode;
  hiddenCount?: number;
  teaserCount?: number;
}) {
  const searching = Boolean(q || location);
  const totalCount = jobs.length + hiddenCount;
  const next = searching ? `/?${new URLSearchParams({ ...(location && { location }), ...(q && { q }) })}` : "/";
  const teaser = teaserCount > 0 ? <SignupTeaser hiddenCount={teaserCount} next={next} /> : null;

  // Phones get a shorter logged-out preview so the sign-up card shows sooner.
  const mobileJobs = !signedIn && !searching ? jobs.slice(0, MOBILE_PREVIEW_COUNT) : jobs;
  const mobileTeaserCount = teaserCount + jobs.length - mobileJobs.length;
  const mobileTeaser =
    mobileTeaserCount > 0 ? <SignupTeaser hiddenCount={mobileTeaserCount} next={next} /> : null;

  return (
    <main className="flex-1">
      <div className="md:hidden">
        <div className="mt-5 pb-6 max-w-3xl mx-auto px-4">{searchRow}</div>
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-6">
          <ResultsSummary count={totalCount} q={q} location={location} />
          {mobileJobs.length === 0 ? <EmptyState /> : <CardList jobs={mobileJobs} />}
          {mobileTeaser && (
            <LockedRows
              teaser={mobileTeaser}
              className="mt-3 flex flex-col gap-3"
              teaserPosition="items-start pt-24"
            >
              {repeat(3, (i) => <PlaceholderCard key={i} />)}
            </LockedRows>
          )}
        </div>
      </div>
      <div className="hidden md:block">
        {searching ? (
          <SidebarBoard
            jobs={jobs}
            totalCount={totalCount}
            q={q}
            location={location}
            searchStacked={searchStacked}
            teaser={teaser}
          />
        ) : (
          <HeroBoard jobs={jobs} signedIn={signedIn} searchRow={searchRow} teaser={teaser} />
        )}
      </div>
    </main>
  );
}
