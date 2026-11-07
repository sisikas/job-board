import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { listJobRequests } from "@/lib/job-requests";
import { LocalTime } from "@/components/LocalTime";

export const metadata = { title: "Job requests — Admin" };

export default async function JobRequestsPage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }

  const requests = await listJobRequests();

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-xl font-semibold text-neutral-900">Job requests</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Forms sent from Post a job, newest first.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-4 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{requests.length}</span>{" "}
          {requests.length === 1 ? "request" : "requests"}
        </p>

        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
            No job requests yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {requests.map((request) => (
              <li key={request.id} className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-neutral-900">{request.business}</h2>
                  <span className="text-sm text-neutral-500">
                    <LocalTime iso={request.createdAt} />
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-700">
                  {request.role} · {request.city}
                  {request.pay ? ` · ${request.pay}` : ""}
                </p>
                <a href={`mailto:${request.email}`} className="mt-1 inline-block text-sm text-neutral-900 underline">
                  {request.email}
                </a>
                <Field label="Job description" value={request.description} />
                <Field label="What's it actually like?" value={request.about} />
                <Field label="How should chefs apply?" value={request.apply} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">{value}</p>
    </div>
  );
}
