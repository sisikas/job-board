import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertsTabs } from "@/components/AlertsTabs";
import { AlertSchedule } from "@/components/AlertSchedule";
import { isAuthed } from "@/lib/auth";
import { listAlertSentDays } from "@/lib/alert-schedule";

export const dynamic = "force-dynamic";
export const metadata = { title: "Alerts Schedule — Admin" };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function parseMonth(value: string | undefined) {
  const now = new Date();
  const fallback = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return fallback;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  if (month < 1 || month > 12) return fallback;
  return { year, month };
}

function monthHref(year: number, month: number) {
  return `/admin/alerts/schedule?month=${year}-${pad(month)}`;
}

export default async function AlertSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin");

  const { year, month } = parseMonth((await searchParams).month);
  const start = `${year}-${pad(month)}-01`;
  const next = shiftMonth(year, month, 1);
  const end = `${next.year}-${pad(next.month)}-01`;
  const previous = shiftMonth(year, month, -1);
  const sentDays = await listAlertSentDays(start, end);
  const title = new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <h1 className="text-xl font-semibold text-neutral-900">Send Alerts</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Tick a day when an alert has gone out. Leave it clear when it has not.
          </p>
          <AlertsTabs current="schedule" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <div className="flex items-center gap-2">
            <Link
              href={monthHref(previous.year, previous.month)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Previous
            </Link>
            <Link
              href={monthHref(next.year, next.month)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Next
            </Link>
          </div>
        </div>
        <AlertSchedule key={`${year}-${month}`} year={year} month={month} sentDays={sentDays} />
      </main>
    </div>
  );
}
