import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { listSignups } from "@/lib/users";
import { SignupList } from "@/components/SignupList";

export const metadata = { title: "Sign-ups — Admin" };

export default async function SignupsPage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }

  const signups = await listSignups();

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold text-neutral-900">Sign-ups</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Everyone who has created an account, newest first.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {signups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
            Nobody has signed up yet.
          </div>
        ) : (
          <SignupList
            signups={signups.map((signup) => ({
              email: signup.email,
              createdAt: signup.createdAt.toISOString(),
              inLastWeek: signup.inLastWeek,
            }))}
          />
        )}
      </main>
    </div>
  );
}
