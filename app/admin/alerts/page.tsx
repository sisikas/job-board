import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertConditions } from "@/components/AlertConditions";
import { AlertsTabs } from "@/components/AlertsTabs";
import { AlertSendList } from "@/components/AlertSendList";
import { MarkAlertsSent } from "@/components/MarkAlertsSent";
import { isAuthed } from "@/lib/auth";
import {
  formatJobPlace,
  getAlertPreview,
  parseAlertSince,
  utcDay,
  type AlertJob,
  type AlertSubscriber,
} from "@/lib/alerts";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Send Alerts — Admin" };

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <p className="text-2xl font-semibold text-neutral-900">{value}</p>
      <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
    </div>
  );
}

function PreferenceBlock({ person }: { person: AlertSubscriber }) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">Roles</p>
        <p className="mt-0.5 text-neutral-800">{person.roles.join(", ") || "—"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">Places</p>
        <p className="mt-0.5 text-neutral-800">{person.locations.join(", ") || "—"}</p>
      </div>
      {person.unmatchedPreferences.length > 0 && (
        <p className="text-amber-800">
          No job matched: {person.unmatchedPreferences.join(", ")}
        </p>
      )}
    </div>
  );
}

function lastEmailed(value: Date | null) {
  if (!value) return "Not emailed yet";
  return `Last emailed ${formatDate(utcDay(value))}`;
}

function JobList({ jobs }: { jobs: AlertJob[] }) {
  return (
    <ul className="space-y-2">
      {jobs.map((job) => (
        <li key={job.id}>
          <Link href={`/jobs/${job.id}`} className="font-medium text-neutral-900 hover:underline">
            {job.role}
          </Link>
          <span className="text-neutral-700"> at {job.venue}</span>
          <p className="text-neutral-500">
            {formatJobPlace(job) || "No city"} · Admin {formatDate(job.adminDate)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ since?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin");

  const params = await searchParams;
  const rawSince = params.since?.trim() ?? "";
  const since = parseAlertSince(rawSince);
  const invalidSince = rawSince !== "" && since === null;
  const preview = await getAlertPreview(since);
  const emailedJobCount = new Set(preview.recipients.flatMap((person) => person.jobs.map((job) => job.id))).size;

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-5">
          <h1 className="text-xl font-semibold text-neutral-900">Send Alerts</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Who would get an email if you sent now, and which jobs would be in it.
            This page does not send email. Tick the roles you put in the email, then mark those as sent.
          </p>
          <AlertsTabs current="send" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <form method="get" className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm text-neutral-700">
              Include jobs with an admin date on or after
              <input
                type="date"
                name="since"
                defaultValue={since ?? ""}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Update preview
            </button>
            <AlertConditions />
            {since && (
              <a href="/admin/alerts" className="text-sm text-neutral-500 underline underline-offset-2">
                Show every job
              </a>
            )}
          </div>
          {invalidSince && (
            <p className="mt-3 text-sm text-red-700">Enter a real date. The preview is showing every job.</p>
          )}
          {!since && !invalidSince && (
            <p className="mt-3 text-sm text-neutral-600">
              No start date yet, so this preview includes every job that has an admin date. Set the
              date when you decide which day alerts should begin.
            </p>
          )}
        </form>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Count value={preview.recipients.length} label="Would get an email" />
          <Count value={emailedJobCount} label="Jobs in those emails" />
          <Count value={preview.unmatchedSubscribers.length} label="Subscribed, no match" />
          <Count value={preview.optedOutCount} label="Said no or unsubscribed" />
        </div>

        <details className="rounded-xl border border-neutral-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-neutral-900">
            Would get an email ({preview.recipients.length})
          </summary>
          {preview.recipients.length === 0 ? (
            <p className="border-t border-neutral-100 px-4 py-4 text-sm text-neutral-500">
              Nobody would get an email for this preview.
            </p>
          ) : (
            <AlertSendList
              key={preview.recipients
                .map((person) => `${person.id}:${person.jobs.map((job) => job.id).join(".")}`)
                .join("|")}
              since={since}
              people={preview.recipients.map((person) => ({
                id: person.id,
                email: person.email,
                lastEmailed: lastEmailed(person.lastSentAt),
                canClear: Boolean(person.lastSentAt),
                roles: person.roles,
                locations: person.locations,
                unmatchedPreferences: person.unmatchedPreferences,
                jobs: person.jobs.map((job) => ({
                  id: job.id,
                  role: job.role,
                  venue: job.venue,
                  place: formatJobPlace(job) || "No city",
                  adminLabel: formatDate(job.adminDate),
                })),
              }))}
            />
          )}
        </details>

        <details className="mt-4 rounded-xl border border-neutral-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-neutral-900">
            Subscribed, no matching jobs ({preview.unmatchedSubscribers.length})
          </summary>
          {preview.unmatchedSubscribers.length === 0 ? (
            <p className="border-t border-neutral-100 px-4 py-4 text-sm text-neutral-500">
              Every subscribed person has at least one matching job.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
              {preview.unmatchedSubscribers.map((person) => (
                <li key={person.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <a href={`mailto:${person.email}`} className="font-medium text-neutral-900 hover:underline">
                      {person.email}
                    </a>
                    <span className="flex flex-wrap items-center gap-2 text-neutral-500">
                      {lastEmailed(person.lastSentAt)}
                      {person.lastSentAt && (
                        <MarkAlertsSent
                          key={`clear-${person.lastSentAt.toISOString()}`}
                          ids={[person.id]}
                          mode="clear"
                          label="Clear"
                          confirm={`Forget every role marked sent for ${person.email}? They can show in the preview again.`}
                        />
                      )}
                    </span>
                  </div>
                  <div className="mt-3">
                    <PreferenceBlock person={person} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </details>

        <details className="mt-4 rounded-xl border border-neutral-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-neutral-900">
            Jobs that would not be emailed ({preview.quietJobs.length} of {preview.jobCount})
          </summary>
          <p className="border-t border-neutral-100 px-4 py-3 text-sm text-neutral-500">
            A job is listed here when nobody&apos;s role and place match it, its admin date is
            before the day they subscribed, or everyone it matches has already been marked sent for it.
          </p>
          {preview.quietJobs.length > 0 && (
            <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
              {preview.quietJobs.map((job) => (
                <li key={job.id} className="px-4 py-3 text-sm">
                  <Link href={`/jobs/${job.id}`} className="font-medium text-neutral-900 hover:underline">
                    {job.role}
                  </Link>
                  <span className="text-neutral-700"> at {job.venue}</span>
                  <p className="text-neutral-500">
                    {formatJobPlace(job) || "No city"} · Admin {formatDate(job.adminDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </details>
      </main>
    </div>
  );
}
