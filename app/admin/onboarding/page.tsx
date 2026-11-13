import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { listOnboardingAnswers, type OnboardingAnswer } from "@/lib/users";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { EmailListTabs } from "@/components/EmailListTabs";
import { LocalTime } from "@/components/LocalTime";

export const metadata = { title: "Email subscribers — Admin" };

function choiceList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "—";
}

function AnswerCard({ answer }: { answer: OnboardingAnswer }) {
  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-4">
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
          <dd className="mt-1 text-neutral-800">
            {answer.unsubscribedAt ? (
              <>
                Unsubscribed <LocalTime iso={answer.unsubscribedAt.toISOString()} />
              </>
            ) : answer.emailAlerts ? (
              "Yes"
            ) : (
              "No"
            )}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function AnswerCards({ answers }: { answers: OnboardingAnswer[] }) {
  if (answers.length === 0) {
    return <p className="text-sm text-neutral-500">Nobody in this list yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {answers.map((answer) => (
        <AnswerCard key={answer.email} answer={answer} />
      ))}
    </ul>
  );
}

function AnswerGroup({
  title,
  answers,
  dropdown = false,
}: {
  title: string;
  answers: OnboardingAnswer[];
  dropdown?: boolean;
}) {
  if (dropdown) {
    return (
      <details className="rounded-xl border border-neutral-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-neutral-900">
          {title} ({answers.length})
        </summary>
        <div className="border-t border-neutral-100 bg-neutral-50 p-4">
          <AnswerCards answers={answers} />
        </div>
      </details>
    );
  }

  return (
    <section>
      <h2 className="text-base font-semibold text-neutral-900">
        {title}{" "}
        <span className="font-normal text-neutral-500">({answers.length})</span>
      </h2>
      <div className="mt-3">
        {answers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-10 text-center text-sm text-neutral-500">
            Nobody in this list yet.
          </div>
        ) : (
          <AnswerCards answers={answers} />
        )}
      </div>
    </section>
  );
}

export default async function OnboardingAdminPage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }

  const answers = await listOnboardingAnswers();
  const unsubscribed = answers.filter((answer) => answer.unsubscribedAt);
  const yes = answers.filter((answer) => answer.emailAlerts && !answer.unsubscribedAt);
  const no = answers.filter((answer) => !answer.emailAlerts && !answer.unsubscribedAt);

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-5">
          <h1 className="text-xl font-semibold text-neutral-900">Email lists</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Roles, places, and email alerts people chose after signing up.
          </p>
          <EmailListTabs current="subscribers" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <p className="mb-6 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{answers.length}</span>{" "}
          {answers.length === 1 ? "person has" : "people have"} answered &middot;{" "}
          <span className="font-semibold text-neutral-900">{yes.length}</span>{" "}
          {yes.length === 1 ? "wants" : "want"} email alerts &middot;{" "}
          <span className="font-semibold text-neutral-900">{unsubscribed.length}</span> unsubscribed
          &middot;{" "}
          <span className="font-semibold text-neutral-900">{no.length}</span> said no
        </p>

        {answers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
            Nobody has finished onboarding yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnswerGroup title="Yes to email alerts" answers={yes} dropdown />
            <AnswerGroup title="Unsubscribed" answers={unsubscribed} />
            <AnswerGroup title="No to email alerts" answers={no} dropdown />
          </div>
        )}
      </main>
    </div>
  );
}
