import { redirect } from "next/navigation";
import { EmailBusinesses } from "@/components/EmailBusinesses";
import { EmailListTabs } from "@/components/EmailListTabs";
import { isAuthed } from "@/lib/auth";

export const metadata = { title: "Email businesses — Admin" };

export default async function EmailBusinessesPage() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-5">
          <h1 className="text-xl font-semibold text-neutral-900">Email lists</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Kitchens you might email. Add, edit, or remove them here.
          </p>
          <EmailListTabs current="businesses" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <EmailBusinesses />
      </main>
    </div>
  );
}
