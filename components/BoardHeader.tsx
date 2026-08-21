import Link from "next/link";
import { getLocations } from "@/lib/jobs";
import { LocationFilter } from "@/components/LocationFilter";

export async function BoardHeader({
  q = "",
  location = "",
}: {
  q?: string;
  location?: string;
}) {
  const locations = await getLocations();

  return (
    <header>
      <div className="max-w-3xl mx-auto px-4 pt-10 sm:pt-12 flex flex-col items-center">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="The Good Sort"
            className="w-28 sm:w-32 h-auto"
          />
        </Link>
      </div>
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-4 sm:pt-20">
        <p className="text-sm sm:text-base" style={{ color: "var(--brand-muted)" }}>
          Search by role or filter by location to see current openings.
        </p>
      </div>
      <div className="max-w-3xl mx-auto px-4">
        <form
          method="get"
          action="/"
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={'Search by role, e.g. "bartender"'}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            style={{
              background: "var(--brand-card)",
              border: "1px solid var(--brand-input-border)",
              color: "var(--brand-ink)",
            }}
          />
          <LocationFilter
            cities={locations.cities}
            countries={locations.countries}
            defaultValue={location}
          />
          <button
            type="submit"
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors"
            style={{ background: "var(--brand-brick)" }}
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
}
