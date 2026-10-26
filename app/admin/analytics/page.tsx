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
    <div className="flex-1" style={{ background: "#fff1f5" }}>
      <header style={{ background: "#fff7fa", borderBottom: "1px solid #f3c6d4" }}>
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#7a2e4a" }}>
              Visits
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#a06a80" }}>
              Visitors and users, for the dates you pick.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/signups"
              className="text-sm underline underline-offset-2"
              style={{ color: "#c4537a" }}
            >
              Sign-ups
            </Link>
            <Link
              href="/admin"
              className="text-sm underline underline-offset-2"
              style={{ color: "#c4537a" }}
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
