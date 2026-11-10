import { getSql } from "@/lib/db";
import { ensureUserTables } from "@/lib/users";

export type PopularRequest = {
  role: string;
  place: string;
  count: number;
};

type Choice = { key: string; label: string };

function choices(values: string[] | null): Choice[] {
  const seen = new Map<string, string>();
  for (const value of values ?? []) {
    const label = value.trim().replace(/\s+/g, " ");
    if (!label) continue;
    const key = label.toLowerCase();
    if (!seen.has(key)) seen.set(key, label);
  }
  return [...seen].map(([key, label]) => ({ key, label }));
}

/** One bar per role-and-place pair. A person is counted once on each pair they asked for. */
export function tallyPopularRequests(
  people: { roles: string[] | null; locations: string[] | null }[]
): PopularRequest[] {
  const buckets = new Map<string, PopularRequest>();
  for (const person of people) {
    for (const role of choices(person.roles)) {
      for (const place of choices(person.locations)) {
        const id = `${role.key}\0${place.key}`;
        const existing = buckets.get(id);
        if (existing) existing.count += 1;
        else buckets.set(id, { role: role.label, place: place.label, count: 1 });
      }
    }
  }
  return [...buckets.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const byRole = a.role.localeCompare(b.role, "en");
    if (byRole !== 0) return byRole;
    return a.place.localeCompare(b.place, "en");
  });
}

/** People who finished onboarding in the inclusive UTC dates, and the pairs they asked for. */
export async function listPopularRequests(from: string | null, to: string | null) {
  await ensureUserTables();
  const sql = getSql();
  const fromClause = from ? sql`AND onboarded_at >= ${from}::date` : sql``;
  const toClause = to ? sql`AND onboarded_at < (${to}::date + interval '1 day')` : sql``;
  const rows = await sql<{ roles: string[] | null; locations: string[] | null }[]>`
    SELECT roles, locations
    FROM users
    WHERE onboarded_at IS NOT NULL
    ${fromClause}
    ${toClause}
  `;
  return { people: rows.length, bars: tallyPopularRequests(rows) };
}
