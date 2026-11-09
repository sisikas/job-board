import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyAlertEmail } from "@/components/CopyAlertEmail";
import { isAuthed } from "@/lib/auth";
import { alertUnsubscribeUrl, getAlertPreview, parseAlertSince, renderAlertEmail } from "@/lib/alerts";
import { ensureUnsubscribeToken } from "@/lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview alert — Admin" };

export default async function AlertPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ since?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin");

  const { userId } = await params;
  const sinceParam = (await searchParams).since;
  const since = parseAlertSince(sinceParam);
  const preview = await getAlertPreview(since);
  const person = [...preview.recipients, ...preview.unmatchedSubscribers].find(
    (subscriber) => subscriber.id === userId
  );
  const back = since ? `/admin/alerts?since=${encodeURIComponent(since)}` : "/admin/alerts";
  const unsubscribeToken =
    person && person.jobs.length > 0 ? await ensureUnsubscribeToken(person.id) : null;
  const email =
    person && person.jobs.length > 0 && unsubscribeToken
      ? {
          current: renderAlertEmail(person, alertUnsubscribeUrl(unsubscribeToken), "current"),
          warm: renderAlertEmail(person, alertUnsubscribeUrl(unsubscribeToken), "warm"),
        }
      : null;

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-sm">
            <Link href={back} className="text-neutral-500 underline underline-offset-2">
              Back to alerts
            </Link>
          </p>
          <h1 className="mt-2 text-xl font-semibold text-neutral-900">
            {person ? `Preview for ${person.email}` : "Preview"}
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {person
              ? "Choose a design, then copy the subject and that message. Nothing is sent from this page."
              : "Nothing is sent from this page."}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {email ? (
          <div>
            <div className="mb-6 rounded-xl border border-neutral-200 bg-white px-6 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Subject</p>
              <p className="mt-1 text-base font-semibold text-neutral-900">{email.current.subject}</p>
            </div>
            {(
              [
                ["Current", email.current],
                ["Warm paper", email.warm],
              ] as const
            ).map(([label, version], index) => (
              <section key={label} className={index === 0 ? "" : "mt-8"}>
                <h2 className="text-base font-semibold text-neutral-900">{label}</h2>
                <div className="mt-3">
                  <CopyAlertEmail
                    subject={version.subject}
                    html={version.html}
                    text={version.text}
                    email={person?.email}
                    showSubject={index === 0}
                  />
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white px-6 py-8">
                  <div dangerouslySetInnerHTML={{ __html: version.html }} />
                </div>
              </section>
            ))}
            <details className="mt-4 rounded-xl border border-neutral-200 bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-neutral-900">
                Plain-text version
              </summary>
              <pre className="overflow-x-auto border-t border-neutral-100 px-4 py-4 text-sm whitespace-pre-wrap text-neutral-800">
                {email.current.text}
              </pre>
            </details>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
            {person
              ? `${person.email} would not get an email for this preview.`
              : "This person is not on the alert list."}
          </div>
        )}
      </main>
    </div>
  );
}
