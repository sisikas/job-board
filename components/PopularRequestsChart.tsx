import type { PopularRequest } from "@/lib/popular-requests";

export function PopularRequestsChart({ bars }: { bars: PopularRequest[] }) {
  const max = bars.reduce((highest, bar) => Math.max(highest, bar.count), 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-end gap-2" role="list" aria-label="Role and place combinations">
        {bars.map((bar) => {
          const height = Math.max(6, Math.round((bar.count / max) * 188));
          const name = `${bar.role} in ${bar.place}`;
          return (
            <div
              key={`${bar.role}\0${bar.place}`}
              role="listitem"
              className="flex w-20 shrink-0 flex-col items-center"
              aria-label={`${name}, asked ${bar.count} ${bar.count === 1 ? "time" : "times"}`}
            >
              <div className="flex h-56 w-full flex-col items-center justify-end border-b border-neutral-200">
                <span className="mb-1 text-xs font-semibold tabular-nums text-neutral-900">{bar.count}</span>
                <div
                  className="w-8 rounded-t"
                  style={{ height, background: "var(--brand-logo-green)" }}
                />
              </div>
              <p className="mt-2 w-full break-words text-center text-[11px] font-medium leading-snug text-neutral-900">
                {bar.role}
              </p>
              <p className="w-full break-words text-center text-[11px] leading-snug text-neutral-500">{bar.place}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
