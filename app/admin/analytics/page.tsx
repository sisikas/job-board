import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

export const metadata = { title: "Analytics — Admin" };

export default async function AnalyticsPage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }

  return (
    <div className="flex-1" style={{ background: "#fff1f5" }}>
      <AdminNav current="analytics" />
      <header style={{ background: "#fff7fa", borderBottom: "1px solid #f3c6d4" }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold" style={{ color: "#7a2e4a" }}>
            Analytics
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#a06a80" }}>
            Visitors and users, for the dates you pick.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}
