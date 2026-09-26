import { getLocations } from "@/lib/jobs";
import { LocationFilter } from "@/components/LocationFilter";

export async function SearchForm({
  q = "",
  location = "",
}: {
  q?: string;
  location?: string;
}) {
  const locations = await getLocations();

  return (
    <form method="get" action="/" className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
      <LocationFilter groups={locations.groups} defaultValue={location} />
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
  );
}
