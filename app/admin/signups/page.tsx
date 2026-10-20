import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { listSignups } from "@/lib/users";
import { LocalTime } from "@/components/LocalTime";

export const metadata = { title: "Sign-ups — Admin" };

export default async function SignupsPage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }

  const signups = await listSignups();
  const thisWeek = signups.filter((s) => s.inLastWeek).length;

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Sign-ups</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Everyone who has created an account, newest first.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
          >
            &larr; Job postings
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            <span className="font-semibold text-neutral-900">{signups.length}</span>{" "}
            {signups.length === 1 ? "account" : "accounts"} in total &middot;{" "}
            <span className="font-semibold text-neutral-900">{thisWeek}</span> in the last 7 days
          </p>
          {signups.length > 0 && (
            <a
              href="/api/admin/signups"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
            >
              Download CSV
            </a>
          )}
        </div>

        {signups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
            Nobody has signed up yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium w-16">#</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {signups.map((signup, index) => (
                  <tr key={signup.email}>
                    <td className="px-4 py-3 text-neutral-400">{signups.length - index}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <a href={`mailto:${signup.email}`} className="hover:underline">
                        {signup.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      <LocalTime iso={signup.createdAt.toISOString()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
