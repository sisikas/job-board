import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { listOnboardingAnswers } from "@/lib/users";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { LocalTime } from "@/components/LocalTime";

export const metadata = { title: "Onboarding — Admin" };

function choiceList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "—";
}

export default async function OnboardingAdminPage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }

  const answers = await listOnboardingAnswers();
  const wantsEmail = answers.filter((answer) => answer.emailAlerts).length;

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Onboarding</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Roles, places, and email alerts people chose after signing up.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/signups"
              className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
            >
              Sign-ups
            </Link>
            <Link
              href="/admin/analytics"
              className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
            >
              Visits
            </Link>
            <Link
              href="/admin"
              className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
            >
              &larr; Job postings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <p className="mb-4 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{answers.length}</span>{" "}
          {answers.length === 1 ? "person has" : "people have"} answered &middot;{" "}
          <span className="font-semibold text-neutral-900">{wantsEmail}</span>{" "}
          {wantsEmail === 1 ? "wants" : "want"} email alerts
        </p>

        {answers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
            Nobody has finished onboarding yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {answers.map((answer) => (
              <li key={answer.email} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <a
                    href={`mailto:${answer.email}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {answer.email}
                  </a>
                  <span className="text-sm text-neutral-500">
                    <LocalTime iso={answer.onboardedAt.toISOString()} />
                  </span>
                </div>
                <div className="mt-3">
                  <ConfirmDelete email={answer.email} kind="onboarder" />
                </div>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-neutral-500">Roles</dt>
                    <dd className="mt-1 text-neutral-800">{choiceList(answer.roles)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-neutral-500">Places</dt>
                    <dd className="mt-1 text-neutral-800">{choiceList(answer.locations)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-neutral-500">Email alerts</dt>
                    <dd className="mt-1 text-neutral-800">{answer.emailAlerts ? "Yes" : "No"}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
