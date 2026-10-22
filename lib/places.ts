import places from "@/data/places.json";

/**
 * Place names for the location box. Cities are the GeoNames "cities with
 * population over 15,000" list (https://www.geonames.org, CC BY 4.0), so a
 * suggestion can appear even when the board has no job there.
 */

export type PlaceHit = { label: string; city: string; country: string };

const countryName = new Map((places.countries as [string, string][]).map(([name, code]) => [code, name]));

type Indexed = PlaceHit & { fold: string; rank: number };

let index: Indexed[] | undefined;

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function getIndex(): Indexed[] {
  if (index) return index;
  const items: Indexed[] = [];
  // Cities are already largest-first. Countries sort after cities of the same name length.
  for (const [name, code] of places.cities as [string, string][]) {
    const country = countryName.get(code) ?? code;
    items.push({
      fold: fold(name),
      label: `${name}, ${country}`,
      city: name,
      country,
      rank: items.length,
    });
  }
  for (const [name] of places.countries as [string, string][]) {
    items.push({
      fold: fold(name),
      label: name,
      city: "",
      country: name,
      rank: items.length,
    });
  }
  index = items;
  return items;
}

/** Up to `limit` countries and cities whose name matches `query`. */
export function searchPlaces(query: string, limit = 8): PlaceHit[] {
  const q = fold(query.trim());
  if (q.length < 2) return [];

  const prefix: Indexed[] = [];
  const contains: Indexed[] = [];
  for (const item of getIndex()) {
    if (item.fold.startsWith(q)) prefix.push(item);
    else if (item.fold.includes(q)) contains.push(item);
  }

  // A longer country prefix ("united", "fran") leads with the country.
  // Shorter prefixes lead with the largest matching city, so "tok" is Tokyo.
  const tier = (item: Indexed) => {
    if (item.fold === q) return 0;
    if (!item.city && item.fold.startsWith(q) && q.length >= 4) return 1;
    return 2;
  };
  prefix.sort((a, b) => tier(a) - tier(b) || a.rank - b.rank);

  const hits = prefix.length >= 2 ? prefix : [...prefix, ...contains];
  return hits.slice(0, limit).map(({ label, city, country }) => ({ label, city, country }));
}
