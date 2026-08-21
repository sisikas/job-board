import { randomUUID } from "crypto";
import { todayISODate } from "@/lib/format";
import { getSql } from "@/lib/db";

export type JobStatus = "open" | "filled";

export type ApplyMethod = "instagram" | "email" | "link";

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
  postedAt: string; // YYYY-MM-DD
};

/**
 * Turns { applyMethod, applyContact } into something renderable: a clickable
 * href, a short button label, and which method it was (so the UI can pick
 * an icon/color) — plus the raw handle/email for anywhere that wants to
 * show it (e.g. a tooltip). Centralized here so the public page and any
 * future surface stay consistent.
 */
export function getApplyInfo(
  job: Pick<Job, "applyMethod" | "applyContact">
): { href: string; label: string; method: ApplyMethod; contact: string } | null {
  const contact = job.applyContact?.trim();
  if (!contact) return null;

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

  // generic link
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
};

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
  };
}

export async function getAllJobs(): Promise<Job[]> {
  const sql = getSql();
  // newest first
  const rows = await sql<JobRow[]>`
    SELECT id, role, venue, city, country, description,
           apply_method, apply_contact, instagram_url, status, posted_at
    FROM jobs
    ORDER BY posted_at DESC, role ASC
  `;
  return rows.map(rowToJob);
}

export type JobFilters = {
  q?: string; // free-text search across role / venue / description
  location?: string; // matches city or country, case-insensitive
};

export async function searchJobs(filters: JobFilters): Promise<Job[]> {
  // Fetched-then-filtered in JS (the dataset is small) so the search behavior
  // stays byte-for-byte identical to before the storage swap.
  const jobs = await getAllJobs();
  const q = filters.q?.trim().toLowerCase();
  const location = filters.location?.trim().toLowerCase();

  return jobs.filter((job) => {
    if (job.status !== "open") return false;

    if (q) {
      const haystack = `${job.role} ${job.venue} ${job.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (location) {
      const jobLocation = `${job.city} ${job.country}`.toLowerCase();
      if (!jobLocation.includes(location)) return false;
    }

    return true;
  });
}

/**
 * Cities and countries kept separate (rather than one flat merged list) so
 * the filter dropdown can group them instead of mixing "Athens" and
 * "Greece" together with no indication of which is which.
 */
export async function getLocations(): Promise<{ cities: string[]; countries: string[] }> {
  const jobs = await getAllJobs();
  const cities = new Set<string>();
  const countries = new Set<string>();
  jobs.forEach((j) => {
    if (j.city) cities.add(j.city);
    if (j.country) countries.add(j.country);
  });
  return {
    cities: Array.from(cities).sort(),
    countries: Array.from(countries).sort(),
  };
}

export async function getJob(id: string): Promise<Job | undefined> {
  const sql = getSql();
  const rows = await sql<JobRow[]>`
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
  input: Omit<Job, "id" | "postedAt"> & { postedAt?: string }
): Promise<Job> {
  const sql = getSql();
  const job: Job = {
    ...input,
    instagramUrl: input.instagramUrl?.trim() || "",
    id: randomUUID(),
    postedAt: input.postedAt?.trim() || todayISODate(),
  };

  await sql`
    INSERT INTO jobs (
      id, role, venue, city, country, description,
      apply_method, apply_contact, instagram_url, status, posted_at
    ) VALUES (
      ${job.id}, ${job.role}, ${job.venue}, ${job.city}, ${job.country}, ${job.description},
      ${job.applyMethod}, ${job.applyContact}, ${job.instagramUrl}, ${job.status}, ${job.postedAt}
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
  const existing = await getJob(id);
  if (!existing) return undefined;

  const defined = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as Partial<Job>;

  const merged: Job = { ...existing, ...defined };

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
      posted_at = ${merged.postedAt}
    WHERE id = ${id}
  `;

  return merged;
}

export async function deleteJob(id: string): Promise<boolean> {
  const sql = getSql();
  const result = await sql`DELETE FROM jobs WHERE id = ${id}`;
  return result.count > 0;
}
