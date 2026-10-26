import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

export const metadata = { title: "Visits — Admin" };

export default async function AnalyticsPage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Visits</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Visitors and users, for the dates you pick.
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
              href="/admin"
              className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
            >
              &larr; Job postings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}
