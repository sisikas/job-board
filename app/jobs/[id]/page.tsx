import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob, getSimilarJobs, getApplyInfo, getInstagramHref } from "@/lib/jobs";
import { formatDate } from "@/lib/format";
import { ApplyButton } from "@/components/ApplyButton";
import { BoardHeader } from "@/components/BoardHeader";
import { InstagramLink } from "@/components/InstagramLink";

export const dynamic = "force-dynamic";

export default async function JobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  const apply = getApplyInfo(job);
  const instagramHref = getInstagramHref(job.instagramUrl);
  const similar = await getSimilarJobs(job);
  const isFilled = job.status === "filled";

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--brand-cream)" }}>
      <BoardHeader />

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium mb-6"
            style={{ color: "var(--brand-muted)" }}
          >
            &larr; All positions
          </Link>

          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "var(--brand-card)",
              border: "1px solid var(--brand-card-border)",
            }}
          >
            {isFilled && (
              <div
                className="inline-block mb-4 rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: "var(--apply-link-bg)", color: "var(--brand-ink)" }}
              >
                This position has been filled
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--brand-ink)" }}>
              {job.role}
            </h1>

            <div className="mt-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="var(--brand-brick)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21h18M6 21V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v14M15 21V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v17M9 9h.01M9 13h.01M18 9h.01M18 13h.01" />
                </svg>
                <p className="text-base sm:text-lg" style={{ color: "var(--brand-ink)" }}>
                  <span className="font-bold">Business:</span> {job.venue}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="var(--brand-brick)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-base sm:text-lg" style={{ color: "var(--brand-ink)" }}>
                  <span className="font-bold">Location:</span> {job.city}
                  {job.country ? `, ${job.country}` : ""}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm" style={{ color: "var(--brand-date)" }}>
              Posted {formatDate(job.postedAt)}
            </p>

            {job.description && (
              <p className="mt-6 text-base leading-relaxed" style={{ color: "var(--brand-body)" }}>
                {job.description}
              </p>
            )}

            <div className="mt-8 flex flex-col items-start gap-4">
              {instagramHref && (
                <InstagramLink href={instagramHref} venueName={job.venue} />
              )}
              {isFilled ? (
                <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
                  This role isn't accepting new applicants right now — check the other open
                  positions below.
                </p>
              ) : apply ? (
                <ApplyButton apply={apply} venueName={job.venue} size="large" />
              ) : (
                <p className="text-sm" style={{ color: "var(--brand-muted)" }}>
                  Send a DM mentioning this role for more info on how to apply.
                </p>
              )}
            </div>
          </div>

          {similar.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold mb-4" style={{ color: "var(--brand-ink)" }}>
                More roles like this
              </h2>
              <ul className="flex flex-col gap-3">
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/jobs/${s.id}`}
                      className="block rounded-2xl p-4 transition-shadow hover:shadow-md"
                      style={{
                        background: "var(--brand-card)",
                        border: "1px solid var(--brand-card-border)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--brand-ink)" }}>
                            {s.role}
                          </p>
                          <p className="text-sm mt-0.5" style={{ color: "var(--brand-meta)" }}>
                            {s.venue} &middot; {s.city}
                            {s.country ? `, ${s.country}` : ""}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-xs whitespace-nowrap mt-0.5"
                          style={{ color: "var(--brand-date)" }}
                        >
                          {formatDate(s.postedAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      <footer>
        <div
          className="max-w-2xl mx-auto px-4 py-6 text-xs text-center"
          style={{ color: "var(--brand-logo-green)" }}
        >
          Have a question about this role? Send a DM and mention the role and
          location.
        </div>
      </footer>
    </div>
  );
}
