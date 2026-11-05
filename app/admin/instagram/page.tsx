import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { InstaSchedule } from "@/components/InstaSchedule";

export const metadata = { title: "Insta schedule — Admin" };

export default async function InstaSchedulePage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-xl font-semibold text-neutral-900">Insta schedule</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Plan a post, then copy the caption when you publish it.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <InstaSchedule />
      </main>
    </div>
  );
}
