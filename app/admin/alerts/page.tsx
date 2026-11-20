import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCategories } from "@/components/AlertCategories";
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
  const emailedJobs = [
    ...new Map(
      preview.recipients
        .flatMap((person) => person.jobs.filter((job) => !job.alreadySent))
        .map((job) => [job.id, job])
    ).values(),
  ];
  const emailedJobCount = emailedJobs.length;

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-5">
          <h1 className="text-xl font-semibold text-neutral-900">Send Alerts</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Who would get an email if you sent now, and which jobs would be in it.
            This page does not send email. Red means already alerted. Send the green New roles, then mark those as sent.
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

        <AlertCategories
          options={[
            { id: "send", value: preview.recipients.length, label: "Would get an email" },
            { id: "jobs", value: emailedJobCount, label: "Jobs in those emails" },
            {
              id: "alerted",
              value: preview.alreadyAlerted.length,
              label: "Matched, already alerted",
              tone: "red",
            },
            { id: "unmatched", value: preview.unmatchedSubscribers.length, label: "Subscribed, no match" },
            { id: "opted", value: preview.optedOutCount, label: "Said no or unsubscribed" },
          ]}
          panels={{
            send:
              preview.recipients.length === 0 ? (
                <p className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-500">
                  Nobody would get an email for this preview.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <AlertSendList
                    key={preview.recipients
                      .map((person) =>
                        `${person.id}:${person.jobs.map((job) => `${job.id}${job.alreadySent ? "s" : "n"}`).join(".")}`
                      )
                      .join("|")}
                    since={since}
                    people={preview.recipients.map((person) => ({
                      id: person.id,
                      email: person.email,
                      lastEmailed: lastEmailed(person.lastSentAt),
                      alertedOn: person.lastSentAt ? formatDate(utcDay(person.lastSentAt)) : null,
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
                        alreadySent: Boolean(job.alreadySent),
                      })),
                    }))}
                  />
                </div>
              ),
            jobs:
              emailedJobs.length === 0 ? (
                <p className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-500">
                  No jobs in those emails.
                </p>
              ) : (
                <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
                  <JobList jobs={emailedJobs} />
                </div>
              ),
            alerted:
              preview.alreadyAlerted.length === 0 ? (
                <p className="rounded-xl border border-red-500 bg-white px-4 py-4 text-sm text-neutral-600">
                  Nobody who matches this search has already been alerted for every role in it.
                </p>
              ) : (
                <ul className="divide-y divide-red-100 rounded-xl border border-red-500 bg-white">
                  {preview.alreadyAlerted.map((person) => (
                    <li key={person.id} className="px-4 py-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <a href={`mailto:${person.email}`} className="font-medium text-neutral-900 hover:underline">
                          {person.email}
                        </a>
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-flex rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
                            Already alerted{person.lastSentAt ? ` · ${formatDate(utcDay(person.lastSentAt))}` : ""}
                          </span>
                          {person.lastSentAt && (
                            <MarkAlertsSent
                              ids={[person.id]}
                              mode="clear"
                              label="Clear"
                              confirm={`Forget every role marked sent for ${person.email}? They can show in the preview again.`}
                            />
                          )}
                        </span>
                      </div>
                      <p className="mt-2 font-bold text-red-700">
                        Do not email again. Every matching role was already sent.
                      </p>
                      <ul className="mt-2 space-y-2">
                        {person.jobs.map((job) => (
                          <li key={job.id}>
                            <span className="mr-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                              Already alerted
                            </span>
                            <Link href={`/jobs/${job.id}`} className="font-medium text-red-700 hover:underline">
                              {job.role}
                            </Link>
                            <span className="text-red-700"> at {job.venue}</span>
                            <p className="text-red-600">
                              {formatJobPlace(job) || "No city"} · Admin {formatDate(job.adminDate)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ),
            unmatched:
              preview.unmatchedSubscribers.length === 0 ? (
                <p className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-500">
                  Every subscribed person has at least one matching job.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
                  {preview.unmatchedSubscribers.map((person) => (
                    <li key={person.id} className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <a href={`mailto:${person.email}`} className="font-medium text-neutral-900 hover:underline">
                          {person.email}
                        </a>
                        <span
                          className={`flex flex-wrap items-center gap-2 ${person.lastSentAt ? "font-bold text-red-600" : "text-neutral-500"}`}
                        >
                          {person.lastSentAt
                            ? `Already alerted · ${formatDate(utcDay(person.lastSentAt))}`
                            : lastEmailed(person.lastSentAt)}
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
              ),
            opted: (
              <p className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-600">
                {preview.optedOutCount} {preview.optedOutCount === 1 ? "person" : "people"} said no at signup or
                unsubscribed. They are left out of every alert.
              </p>
            ),
          }}
        />
      </main>
    </div>
  );
}
