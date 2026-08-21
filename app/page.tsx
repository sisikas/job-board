import Link from "next/link";
import { searchJobs } from "@/lib/jobs";
import { formatDate } from "@/lib/format";
import { BoardHeader } from "@/components/BoardHeader";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const location = params.location || "";

  const jobs = await searchJobs({ q, location });

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--brand-cream)" }}>
      <BoardHeader q={q} location={location} />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
          {(q || location) && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
                {jobs.length} {jobs.length === 1 ? "result" : "results"}
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
          )}

          {jobs.length === 0 ? (
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
          ) : (
            <ul className="flex flex-col gap-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="block rounded-2xl p-5 transition-shadow hover:shadow-md"
                    style={{
                      background: "var(--brand-card)",
                      border: "1px solid var(--brand-card-border)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--brand-ink)" }}>
                          {job.role}
                        </h2>
                        <p className="text-sm mt-1 font-semibold" style={{ color: "var(--brand-meta)" }}>
                          {job.venue} &middot;{" "}
                          <span style={{ color: "var(--brand-brick)" }}>
                            {job.city}
                            {job.country ? `, ${job.country}` : ""}
                          </span>
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-xs whitespace-nowrap"
                        style={{ color: "var(--brand-date)" }}
                      >
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
          )}
        </div>
      </main>

      <footer>
        <div
          className="max-w-3xl mx-auto px-4 py-6 text-xs text-center"
          style={{ color: "var(--brand-logo-green)" }}
        >
          Have a question about a specific role? Send a DM and mention the
          role and location.
        </div>
      </footer>
    </div>
  );
}
