import { getLocations } from "@/lib/jobs";
import { LocationFilter } from "@/components/LocationFilter";
import { SiteHeader } from "@/components/SiteHeader";

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
      <SiteHeader />
      <div className="max-w-3xl mx-auto px-4 pt-5 pb-3 sm:pt-10 sm:pb-4">
        <p className="text-sm sm:text-base" style={{ color: "var(--brand-muted)" }}>
          Search by role or location to see current openings.
        </p>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-6 sm:pb-10">
        <form
          method="get"
          action="/"
          className="flex flex-col sm:flex-row gap-2.5 sm:gap-3"
        >
          <LocationFilter
            groups={locations.groups}
            defaultValue={location}
          />
          <span
            className="self-center text-sm font-bold"
            style={{ color: "var(--brand-brick)" }}
          >
            OR
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={'Search by role, e.g. "chef"'}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
            style={{
              background: "var(--brand-card)",
              border: "1px solid var(--brand-input-border)",
              color: "var(--brand-ink)",
            }}
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
