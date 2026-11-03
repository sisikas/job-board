import { randomUUID } from "crypto";
import { todayISODate } from "@/lib/format";
import { getSql } from "@/lib/db";

export type JobStatus = "open" | "filled";

export type ApplyMethod = "instagram" | "email" | "link" | "website" | "text";

export type Job = {
  id: string;
  role: string;
  venue: string;
  city: string;
  country: string;
  description: string;
  applyMethod: ApplyMethod;
  applyContact: string; // an @handle, an email address, or a URL — meaning depends on applyMethod
  instagramUrl: string; // business Instagram — full URL, instagram.com/..., or @handle
  status: JobStatus;
  postedAt: string; // YYYY-MM-DD, shown to the public
  adminDate?: string; // YYYY-MM-DD, alerts only — never shown on the public site
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reads a free-text "Ways to apply" value from a new posting.
 * Older postings keep the method they were saved with and never come through here.
 */
function classifyWaysToApply(value: string): "email" | "instagram" | "website" | "text" {
  const contact = value.trim();
  if (!contact) return "text";

  if (/^mailto:/i.test(contact) || EMAIL_RE.test(contact)) return "email";
  if (isInstagramContact(contact)) return "instagram";
  if (isWebsiteContact(contact)) return "website";
  return "text";
}

function isInstagramContact(contact: string): boolean {
  if (/^@[\w.]+$/.test(contact)) return true;
  try {
    const withProto = /^https?:\/\//i.test(contact) ? contact : `https://${contact}`;
    const host = new URL(withProto).hostname.replace(/^www\./i, "").toLowerCase();
    return host === "instagram.com" || host === "instagr.am";
  } catch {
    return false;
  }
}

function isWebsiteContact(contact: string): boolean {
  if (/\s/.test(contact)) return false;
  try {
    const withProto = /^https?:\/\//i.test(contact) ? contact : `https://${contact}`;
    return new URL(withProto).hostname.includes(".");
  } catch {
    return false;
  }
}

function instagramHandleFromText(contact: string): string {
  if (/^@/.test(contact) && !/^https?:/i.test(contact) && !/instagram\.com/i.test(contact)) {
    return contact.replace(/^@/, "").split(/[/?#]/)[0];
  }
  try {
    const withProto = /^https?:\/\//i.test(contact) ? contact : `https://${contact}`;
    const part = new URL(withProto).pathname.split("/").filter(Boolean)[0] || "";
    return part.replace(/^@/, "");
  } catch {
    return contact.replace(/^@/, "").replace(/\/$/, "");
  }
}

/**
 * Turns { applyMethod, applyContact } into something renderable: a clickable
 * href, a short button label, and which method it was (so the UI can pick
 * an icon/color) — plus the raw handle/email for anywhere that wants to
 * show it (e.g. a tooltip). Centralized here so the public page and any
 * future surface stay consistent.
 *
 * Jobs saved as email, Instagram, or a generic link keep that button.
 * A new posting stores plain text, and the button is chosen from that text.
 */
export function getApplyInfo(
  job: Pick<Job, "applyMethod" | "applyContact">
): { href: string; label: string; method: ApplyMethod; contact: string } | null {
  const contact = job.applyContact?.trim();
  if (!contact) return null;

  if (job.applyMethod === "text") {
    const kind = classifyWaysToApply(contact);
    if (kind === "email") {
      const email = contact.replace(/^mailto:/i, "");
      return { href: `mailto:${email}`, label: "Email to apply", method: "email", contact: email };
    }
    if (kind === "instagram") {
      const handle = instagramHandleFromText(contact);
      return { href: `https://instagram.com/${handle}`, label: "DM to apply", method: "instagram", contact: handle };
    }
    if (kind === "website") {
      const href = /^https?:\/\//i.test(contact) ? contact : `https://${contact}`;
      return { href, label: "Website to apply", method: "website", contact: href };
    }
    return { href: "", label: "Ways to apply", method: "text", contact };
  }

  if (job.applyMethod === "email") {
    const email = contact.replace(/^mailto:/i, "");
    return { href: `mailto:${email}`, label: "Email to apply", method: "email", contact: email };
  }

  if (job.applyMethod === "instagram") {
    // accept a bare handle, an @handle, or a full instagram.com URL
    const handle = contact
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/$/, "")
      .trim();
    return { href: `https://instagram.com/${handle}`, label: "DM to apply", method: "instagram", contact: handle };
  }

  // generic link — kept for postings saved before Ways to apply was free text
  const href = /^https?:\/\//i.test(contact) ? contact : `https://${contact}`;
  return { href, label: "Apply here", method: "link", contact };
}

/**
 * Turns a stored business Instagram value into a clickable profile URL.
 * Accepts a full instagram.com URL, a bare path, or an @handle.
 */
export function getInstagramHref(value?: string): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  let href = raw.replace(/^@/, "").trim();
  if (!href) return null;

  if (!/^https?:\/\//i.test(href)) {
    if (/^(www\.)?instagram\.com\//i.test(href)) {
      href = `https://${href}`;
    } else {
      href = `https://instagram.com/${href.replace(/\/$/, "")}`;
    }
  }

  return href;
}

/**
 * All reads/writes go through this module. Storage is a Postgres table (`jobs`),
 * reached through the shared client in `lib/db.ts`. This works on Vercel's
 * serverless runtime — unlike the previous JSON-file version, edits made through
 * the /admin page persist. Set DATABASE_URL to a free Neon/Supabase/Vercel
 * Postgres connection string; run `npm run db:setup` once to create the table
 * and load your existing postings. See README.md.
 *
 * The table uses snake_case columns; `rowToJob` maps a row back to the camelCase
 * `Job` shape the rest of the app already expects, so nothing outside this file
 * changed. `posted_at` is stored as text ("YYYY-MM-DD") to preserve the exact
 * string semantics the UI relies on (sorting, formatDate).
 */

type JobRow = {
  id: string;
  role: string;
  venue: string;
  city: string;
  country: string;
  description: string;
  apply_method: string;
  apply_contact: string;
  instagram_url: string;
  status: string;
  posted_at: string;
  admin_date?: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

let columnsReady: Promise<void> | undefined;

/** Adds the private alert date and copies the posted date onto existing jobs. */
export function ensureJobColumns(): Promise<void> {
  if (!columnsReady) {
    const sql = getSql();
    columnsReady = (async () => {
      await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS admin_date text`;
      await sql`
        UPDATE jobs
        SET admin_date = posted_at
        WHERE admin_date IS NULL OR btrim(admin_date) = ''
      `;
    })().catch((err) => {
      columnsReady = undefined;
      throw err;
    });
  }
  return columnsReady;
}

function cleanDate(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? "";
  if (!DATE_RE.test(trimmed)) return fallback;
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString().slice(0, 10) === trimmed ? trimmed : fallback;
}

function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    role: row.role,
    venue: row.venue,
    city: row.city,
    country: row.country ?? "",
    description: row.description ?? "",
    applyMethod: (row.apply_method as ApplyMethod) ?? "instagram",
    applyContact: row.apply_contact ?? "",
    instagramUrl: row.instagram_url ?? "",
    status: (row.status as JobStatus) ?? "open",
    postedAt: row.posted_at,
    ...(row.admin_date ? { adminDate: row.admin_date } : {}),
  };
}

export async function getAllJobs(): Promise<Job[]> {
  await ensureJobColumns();
  const sql = getSql();
  // newest first. The public select leaves out admin_date.
  const rows = await sql<JobRow[]>`
    SELECT id, role, venue, city, country, description,
           apply_method, apply_contact, instagram_url, status, posted_at
    FROM jobs
    ORDER BY posted_at DESC, role ASC
  `;
  return rows.map(rowToJob);
}

async function getAdminJob(id: string): Promise<Job | undefined> {
  await ensureJobColumns();
  const rows = await getSql()<JobRow[]>`
    SELECT id, role, venue, city, country, description,
           apply_method, apply_contact, instagram_url, status, posted_at, admin_date
    FROM jobs
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToJob(rows[0]) : undefined;
}

/** Every posting, including the private admin date. Admin-only. */
export async function getAdminJobs(): Promise<Job[]> {
  await ensureJobColumns();
  const rows = await getSql()<JobRow[]>`
    SELECT id, role, venue, city, country, description,
           apply_method, apply_contact, instagram_url, status, posted_at, admin_date
    FROM jobs
    ORDER BY posted_at DESC, role ASC
  `;
  return rows.map(rowToJob);
}

export type JobFilters = {
  q?: string; // free-text search across role / venue / description
  location?: string; // typed text: matches city or country, case-insensitive
  city?: string; // picked from the place list
  country?: string;
  roles?: string[]; // exact role names, any of them
  roleText?: string[]; // typed roles: the job title contains the words
  places?: string[]; // "City, Country", a country, or Anywhere
};

function roleTextMatches(jobRole: string, typed: string) {
  const role = jobRole.trim().toLowerCase();
  const query = typed.trim().toLowerCase();
  if (!query) return false;
  if (role.includes(query)) return true;
  const words = query.split(/\s+/).filter(Boolean);
  return words.length > 1 && words.every((word) => role.includes(word));
}

export async function searchJobs(filters: JobFilters): Promise<Job[]> {
  // Fetched-then-filtered in JS (the dataset is small) so the search behavior
  // stays byte-for-byte identical to before the storage swap.
  const jobs = await getAllJobs();
  const q = filters.q?.trim().toLowerCase();
  const location = filters.location?.trim().toLowerCase();
  const city = filters.city?.trim().toLowerCase();
  const country = filters.country?.trim().toLowerCase();
  const roles = (filters.roles ?? []).map((role) => role.trim().toLowerCase()).filter(Boolean);
  const roleText = (filters.roleText ?? []).map((role) => role.trim()).filter(Boolean);
  const places = (filters.places ?? []).map((place) => place.trim()).filter(Boolean);
  const anywhere = places.some((place) => place.toLowerCase() === "anywhere");
  const specificPlaces = places.filter((place) => place.toLowerCase() !== "anywhere");

  return jobs.filter((job) => {
    if (job.status !== "open") return false;

    if (q) {
      const haystack = `${job.role} ${job.venue} ${job.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (roles.length > 0 || roleText.length > 0) {
      const jobRole = job.role.trim().toLowerCase();
      const exact = roles.includes(jobRole);
      const typed = roleText.some((text) => roleTextMatches(job.role, text));
      if (!exact && !typed) return false;
    }
    if (!anywhere && specificPlaces.length > 0 && !specificPlaces.some((place) => placeMatches(job, place))) {
      return false;
    }

    if (city || country) {
      if (city && job.city.trim().toLowerCase() !== city) return false;
      if (country && job.country.trim().toLowerCase() !== country) return false;
    } else if (location) {
      const jobLocation = `${job.city} ${job.country}`.toLowerCase();
      if (!jobLocation.includes(location)) return false;
    }

    return true;
  });
}

function placeMatches(job: Job, place: string) {
  const raw = place.trim().toLowerCase();
  const city = job.city.trim().toLowerCase();
  const country = job.country.trim().toLowerCase();
  const [cityPart, ...rest] = raw.split(",").map((part) => part.trim());
  const countryPart = rest.join(", ");
  if (countryPart) {
    return city === cityPart && (country === countryPart || country.includes(countryPart));
  }
  return city === raw || country === raw || `${city} ${country}`.includes(raw);
}

/**
 * Locations grouped country → cities so the filter can list countries first,
 * with each country's cities nested underneath.
 */
export type LocationGroup = { country: string; cities: string[] };

export async function getLocations(): Promise<{ groups: LocationGroup[] }> {
  const jobs = await getAllJobs();
  const byCountry = new Map<string, Set<string>>();

  jobs.forEach((j) => {
    const country = j.country?.trim() || "Other";
    const city = j.city?.trim();
    if (!byCountry.has(country)) byCountry.set(country, new Set());
    if (city) byCountry.get(country)!.add(city);
  });

  return {
    groups: Array.from(byCountry.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, cities]) => ({
        country,
        cities: Array.from(cities).sort((a, b) => a.localeCompare(b)),
      })),
  };
}

export async function getJob(id: string): Promise<Job | undefined> {
  await ensureJobColumns();
  const rows = await getSql()<JobRow[]>`
    SELECT id, role, venue, city, country, description,
           apply_method, apply_contact, instagram_url, status, posted_at
    FROM jobs
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToJob(rows[0]) : undefined;
}

/**
 * Other open postings to surface at the bottom of a job's detail page.
 * Prefers the same role first (e.g. other "Bartender" openings), then tops
 * up with postings in the same city/country if there aren't enough — so the
 * section rarely comes up completely empty.
 */
export async function getSimilarJobs(job: Job, limit = 3): Promise<Job[]> {
  const jobs = await getAllJobs();
  const candidates = jobs.filter((j) => j.id !== job.id && j.status === "open");

  const sameRole = candidates.filter(
    (j) => j.role.trim().toLowerCase() === job.role.trim().toLowerCase()
  );

  const sameLocation = candidates.filter(
    (j) =>
      !sameRole.includes(j) &&
      ((job.city && j.city.trim().toLowerCase() === job.city.trim().toLowerCase()) ||
        (job.country && j.country.trim().toLowerCase() === job.country.trim().toLowerCase()))
  );

  return [...sameRole, ...sameLocation].slice(0, limit);
}

export async function createJob(
  input: Omit<Job, "id" | "postedAt" | "adminDate"> & { postedAt?: string; adminDate?: string }
): Promise<Job> {
  await ensureJobColumns();
  const sql = getSql();
  const postedAt = cleanDate(input.postedAt, todayISODate());
  const adminDate = cleanDate(input.adminDate, postedAt);
  const job: Job = {
    ...input,
    instagramUrl: input.instagramUrl?.trim() || "",
    id: randomUUID(),
    postedAt,
    adminDate,
  };

  await sql`
    INSERT INTO jobs (
      id, role, venue, city, country, description,
      apply_method, apply_contact, instagram_url, status, posted_at, admin_date
    ) VALUES (
      ${job.id}, ${job.role}, ${job.venue}, ${job.city}, ${job.country}, ${job.description},
      ${job.applyMethod}, ${job.applyContact}, ${job.instagramUrl}, ${job.status}, ${job.postedAt},
      ${adminDate}
    )
  `;

  return job;
}

export async function updateJob(
  id: string,
  updates: Partial<Omit<Job, "id">>
): Promise<Job | undefined> {
  // Read-merge-write so a partial update (e.g. only { status }) can never wipe
  // out fields the caller simply didn't send — same semantics as before.
  await ensureJobColumns();
  const existing = await getAdminJob(id);
  if (!existing) return undefined;

  const defined = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as Partial<Job>;

  const merged: Job = { ...existing, ...defined };
  const postedAt = cleanDate(merged.postedAt, existing.postedAt);
  const adminDate = cleanDate(merged.adminDate, existing.adminDate || existing.postedAt);
  merged.postedAt = postedAt;
  merged.adminDate = adminDate;

  const sql = getSql();
  await sql`
    UPDATE jobs SET
      role = ${merged.role},
      venue = ${merged.venue},
      city = ${merged.city},
      country = ${merged.country},
      description = ${merged.description},
      apply_method = ${merged.applyMethod},
      apply_contact = ${merged.applyContact},
      instagram_url = ${merged.instagramUrl},
      status = ${merged.status},
      posted_at = ${postedAt},
      admin_date = ${adminDate}
    WHERE id = ${id}
  `;

  return merged;
}

export async function deleteJob(id: string): Promise<boolean> {
  const sql = getSql();
  const result = await sql`DELETE FROM jobs WHERE id = ${id}`;
  return result.count > 0;
}
