import { redirect } from "next/navigation";
import { AlertsTabs } from "@/components/AlertsTabs";
import { PopularRequestsChart } from "@/components/PopularRequestsChart";
import { isAuthed } from "@/lib/auth";
import { listPopularRequests } from "@/lib/popular-requests";

export const dynamic = "force-dynamic";
export const metadata = { title: "Popular requests — Admin" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(value: string): string | null {
  if (!DATE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

export default async function PopularRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin");

  const params = await searchParams;
  const fromRaw = params.from?.trim() ?? "";
  const toRaw = params.to?.trim() ?? "";
  const from = parseDay(fromRaw);
  const to = parseDay(toRaw);
  const fromInvalid = fromRaw !== "" && from === null;
  const toInvalid = toRaw !== "" && to === null;
  const orderInvalid = from !== null && to !== null && from > to;
  const ready = !fromInvalid && !toInvalid && !orderInvalid;
  const result = ready ? await listPopularRequests(from, to) : null;

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-5">
          <h1 className="text-xl font-semibold text-neutral-900">Send Alerts</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Which role and place pairs people asked for, so you can see which jobs to find and which alerts are worth sending.
          </p>
          <AlertsTabs current="popular" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <form method="get" className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm text-neutral-700">
              From
              <input
                type="date"
                name="from"
                defaultValue={from ?? ""}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-neutral-700">
              To
              <input
                type="date"
                name="to"
                defaultValue={to ?? ""}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Show requests
            </button>
            {(fromRaw || toRaw) && (
              <a href="/admin/alerts/popular" className="text-sm text-neutral-500 underline underline-offset-2">
                All time
              </a>
            )}
          </div>
          {fromInvalid || toInvalid ? (
            <p className="mt-3 text-sm text-red-700">Enter real dates. Both days are included.</p>
          ) : orderInvalid ? (
            <p className="mt-3 text-sm text-red-700">The start date is after the end date.</p>
          ) : (
            <p className="mt-3 text-sm text-neutral-600">
              Leave both dates empty to see everyone. The dates are when they finished onboarding, and the roles and places are what they have saved now.
            </p>
          )}
        </form>

        {result && (
          <>
            <p className="mb-4 text-sm text-neutral-600">
              <span className="font-semibold text-neutral-900">{result.people}</span>{" "}
              {result.people === 1 ? "person" : "people"} finished onboarding
              {from || to ? " in these dates" : ""}.{" "}
              <span className="font-semibold text-neutral-900">{result.bars.length}</span>{" "}
              {result.bars.length === 1 ? "combination" : "combinations"}. Each bar is one role in one place, counted once per person.
            </p>
            {result.bars.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center text-sm text-neutral-500">
                {result.people === 0
                  ? "Nobody finished onboarding in these dates."
                  : "Nobody in these dates left both a role and a place."}
              </div>
            ) : (
              <PopularRequestsChart bars={result.bars} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
