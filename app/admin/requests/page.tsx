import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { listJobRequests } from "@/lib/job-requests";
import { JobRequestList } from "@/components/JobRequestList";

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
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
            No job requests yet.
          </div>
        ) : (
          <JobRequestList requests={requests} />
        )}
      </main>
    </div>
  );
}
