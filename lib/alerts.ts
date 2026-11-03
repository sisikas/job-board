import { getSql } from "@/lib/db";
import { ensureJobColumns } from "@/lib/jobs";
import { ensureUserTables } from "@/lib/users";

/**
 * Read-only preview of who would receive a job alert.
 *
 * Matching starts from jobs whose admin date is on or after `since` (every
 * job, when `since` is null). The employer's posted date is not used. A
 * subscribed person gets a job when all of these hold:
 * - one of their roles is that job's role (Chef and Sous Chef stay separate).
 *   "part-time" and "private", in any spacing or punctuation, are ignored on
 *   the job title, so "Chef (part-time)" and "Private Chef" match Chef.
 * - one of their places is the job's city, the job's country, or Anywhere
 * - they asked for alerts and have not unsubscribed. People who said no at
 *   signup stay out, because email_alerts is false for them.
 * - the job's admin date is after the UTC day they subscribed
 * - the job's admin date is after the UTC day of their last alert, if any
 *
 * Callers group the rows so each person appears once, with every matching job.
 * Nothing here sends mail or writes a last-sent time.
 */

export type AlertJob = {
  id: string;
  role: string;
  venue: string;
  city: string;
  country: string;
  postedAt: string;
  adminDate: string;
  description: string;
};

export type AlertSubscriber = {
  id: string;
  email: string;
  roles: string[];
  locations: string[];
  subscribedAt: Date | null;
  lastSentAt: Date | null;
  jobs: AlertJob[];
  /** Roles and places on their list that matched no eligible job this run. */
  unmatchedPreferences: string[];
};

export type AlertPreview = {
  since: string | null;
  recipients: AlertSubscriber[];
  unmatchedSubscribers: AlertSubscriber[];
  quietJobs: AlertJob[];
  jobCount: number;
  optedOutCount: number;
};

type MatchRow = {
  user_id: string;
  email: string;
  roles: string[] | null;
  locations: string[] | null;
  alerts_last_sent_at: Date | string | null;
  onboarded_at: Date | string | null;
  job_id: string;
  job_role: string;
  venue: string;
  city: string;
  country: string | null;
  posted_at: string;
  admin_date: string;
  description: string | null;
};

type JobRow = {
  id: string;
  role: string;
  venue: string;
  city: string;
  country: string | null;
  posted_at: string;
  admin_date: string;
  description: string | null;
};

type SubscriberRow = {
  id: string;
  email: string;
  roles: string[] | null;
  locations: string[] | null;
  alerts_last_sent_at: Date | string | null;
  onboarded_at: Date | string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseAlertSince(value: string | undefined): string | null {
  if (!value || !DATE_RE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

function asDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanList(values: string[] | null): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function norm(value: string): string {
  return value.trim().toLowerCase();
}

/** UTC calendar day, matching `to_char(... AT TIME ZONE 'UTC', 'YYYY-MM-DD')`. */
export function utcDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function jobFromRow(row: JobRow): AlertJob {
  return {
    id: row.id,
    role: row.role,
    venue: row.venue,
    city: row.city,
    country: row.country ?? "",
    postedAt: row.posted_at,
    adminDate: row.admin_date,
    description: row.description ?? "",
  };
}

/**
 * Same place rule as the SQL join: Anywhere, the job's city, or the job's
 * country. A country preference therefore covers every city stored with that
 * country.
 */
function placeMatches(place: string, job: Pick<AlertJob, "city" | "country">): boolean {
  const wanted = norm(place);
  if (!wanted) return false;
  if (wanted === "anywhere") return true;
  if (wanted === norm(job.city)) return true;
  const country = norm(job.country);
  return country !== "" && wanted === country;
}

/** Lowercase, with punctuation turned into spaces. "Part-Time" and "part time" match. */
function foldRole(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Job title with part-time and private removed. "Private Chef (part-time)"
 * becomes "chef". "Chef de Partie" stays whole, because "partie" is not "part-time".
 */
function coreRole(jobRole: string): string {
  return foldRole(jobRole)
    .replace(/\bpart timers?\b/g, " ")
    .replace(/\bpart time\b/g, " ")
    .replace(/\bparttime\b/g, " ")
    .replace(/\bprivate\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roleMatches(wanted: string, jobRole: string): boolean {
  const role = foldRole(wanted);
  if (!role) return false;
  const titled = foldRole(jobRole);
  return role === titled || role === coreRole(jobRole);
}

/** Admin date must be after signup, and after the last email when one exists. */
function eligibleByDate(
  adminDate: string,
  subscribedAt: Date | null,
  lastSentAt: Date | null
): boolean {
  if (!subscribedAt || !(adminDate > utcDay(subscribedAt))) return false;
  if (!lastSentAt) return true;
  return adminDate > utcDay(lastSentAt);
}

function unmatchedPreferences(
  person: Pick<AlertSubscriber, "roles" | "locations" | "subscribedAt" | "lastSentAt">,
  jobs: AlertJob[]
): string[] {
  const eligible = jobs.filter((job) =>
    eligibleByDate(job.adminDate, person.subscribedAt, person.lastSentAt)
  );
  const roles = person.roles.filter(
    (role) =>
      !eligible.some(
        (job) => roleMatches(role, job.role) && person.locations.some((place) => placeMatches(place, job))
      )
  );
  const places = person.locations.filter((place) => {
    if (norm(place) === "anywhere") return false;
    return !eligible.some(
      (job) => placeMatches(place, job) && person.roles.some((role) => roleMatches(role, job.role))
    );
  });
  return [...roles, ...places];
}

export function formatJobPlace(job: Pick<AlertJob, "city" | "country">): string {
  return [job.city, job.country].map((part) => part.trim()).filter(Boolean).join(", ");
}

function siteOrigin(): string {
  return (process.env.SITE_URL || "https://thegoodsort.vercel.app").replace(/\/$/, "");
}

export function jobPublicUrl(id: string): string {
  return `${siteOrigin()}/jobs/${id}`;
}

export function alertUnsubscribeUrl(token: string): string {
  return `${siteOrigin()}/unsubscribe/${token}`;
}

export function alertSubject(count: number): string {
  return count === 1 ? "1 new job on The Good Sort" : `${count} new jobs on The Good Sort`;
}

function joinList(values: string[]): string {
  const items = values.map((value) => value.trim()).filter(Boolean);
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function preferenceSentence(person: Pick<AlertSubscriber, "roles" | "locations">): string {
  const roles = joinList(person.roles);
  const places = joinList(person.locations);
  if (roles && places) return `You asked for alerts for ${roles} in ${places}.`;
  if (roles) return `You asked for alerts for ${roles}.`;
  return "You asked for job alerts.";
}

function excerpt(value: string): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= 180) return text;
  return `${text.slice(0, 177).trimEnd()}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The message body a recipient would get. Sending is still a separate step. */
export function renderAlertEmail(
  person: AlertSubscriber,
  unsubscribeUrl: string
): { subject: string; text: string; html: string } {
  const subject = alertSubject(person.jobs.length);
  const because = preferenceSentence(person);
  const unsubscribeLine =
    "Not for you anymore? Unsubscribe. One click, no “are you sure?” pages :)";
  const textJobs = person.jobs
    .map((job) => {
      const place = formatJobPlace(job);
      const summary = excerpt(job.description);
      const lines = [
        `${job.role} at ${job.venue}`,
        place,
        summary,
        jobPublicUrl(job.id),
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");
  const text = `New jobs for you\n\nThese match the roles and places you asked for.\n\n${textJobs}\n\n${because}\n\n${unsubscribeLine}\n${unsubscribeUrl}`;

  const htmlJobs = person.jobs
    .map((job) => {
      const place = formatJobPlace(job);
      const summary = excerpt(job.description);
      const url = escapeHtml(jobPublicUrl(job.id));
      return `
        <div style="border:1px solid #e6e0d6;border-radius:12px;padding:14px 16px;margin:0 0 12px">
          <p style="margin:0;font-weight:700">${escapeHtml(job.role)}</p>
          <p style="margin:4px 0 0;color:#7d7263">${escapeHtml(job.venue)}${place ? ` · ${escapeHtml(place)}` : ""}</p>
          ${summary ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.45">${escapeHtml(summary)}</p>` : ""}
          <p style="margin:12px 0 0"><a href="${url}" style="display:inline-block;background:#517228;color:#ffffff;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:999px">View this job</a></p>
        </div>`;
    })
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#211c14">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#517228;font-weight:700">The Good Sort</p>
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 8px">New jobs for you</h1>
      <p style="margin:0 0 20px;line-height:1.5">These match the roles and places you asked for.</p>
      ${htmlJobs}
      <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#7d7263">${escapeHtml(because)}</p>
      <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#7d7263">Not for you anymore? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#517228;font-weight:700">Unsubscribe</a>. One click, no “are you sure?” pages :)</p>
    </div>`;

  return { subject, text, html };
}

export async function getAlertPreview(since: string | null): Promise<AlertPreview> {
  await Promise.all([ensureUserTables(), ensureJobColumns()]);
  const sql = getSql();
  const adminCutoff = since ? sql`j.admin_date >= ${since}` : sql`TRUE`;
  const jobCutoff = since ? sql`admin_date >= ${since}` : sql`TRUE`;

  const [matchRows, jobRows, subscriberRows, optedOutRows] = await Promise.all([
    sql<MatchRow[]>`
      SELECT
        u.id AS user_id,
        u.email,
        u.roles,
        u.locations,
        u.alerts_last_sent_at,
        u.onboarded_at,
        j.id AS job_id,
        j.role AS job_role,
        j.venue,
        j.city,
        j.country,
        j.posted_at,
        j.admin_date,
        j.description
      FROM jobs j
      JOIN users u
        ON u.email_alerts = true
       AND u.unsubscribed_at IS NULL
       AND EXISTS (
         SELECT 1 FROM unnest(u.roles) AS role_name
         WHERE btrim(role_name) <> ''
           AND (
             btrim(regexp_replace(lower(role_name), '[^a-z0-9]+', ' ', 'g'))
               = btrim(regexp_replace(lower(j.role), '[^a-z0-9]+', ' ', 'g'))
             OR btrim(regexp_replace(lower(role_name), '[^a-z0-9]+', ' ', 'g'))
               = btrim(regexp_replace(
                   regexp_replace(
                     regexp_replace(
                       regexp_replace(
                         regexp_replace(
                           regexp_replace(lower(j.role), '[^a-z0-9]+', ' ', 'g'),
                           '\\mpart timers?\\M', ' ', 'g'
                         ),
                         '\\mpart time\\M', ' ', 'g'
                       ),
                       '\\mparttime\\M', ' ', 'g'
                     ),
                     '\\mprivate\\M', ' ', 'g'
                   ),
                   '\\s+', ' ', 'g'
                 ))
           )
       )
       AND EXISTS (
         SELECT 1 FROM unnest(u.locations) AS place
         WHERE btrim(place) <> ''
           AND (
             lower(btrim(place)) = 'anywhere'
             OR lower(btrim(place)) = lower(btrim(j.city))
             OR (btrim(j.country) <> '' AND lower(btrim(place)) = lower(btrim(j.country)))
           )
       )
      WHERE j.admin_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        AND ${adminCutoff}
        AND u.onboarded_at IS NOT NULL
        AND j.admin_date > to_char(u.onboarded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
        AND (
          u.alerts_last_sent_at IS NULL
          OR j.admin_date > to_char(u.alerts_last_sent_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
        )
      ORDER BY u.email ASC, j.admin_date DESC, j.role ASC
    `,
    sql<JobRow[]>`
      SELECT id, role, venue, city, country, posted_at, admin_date, description
      FROM jobs
      WHERE admin_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        AND ${jobCutoff}
      ORDER BY admin_date DESC, role ASC
    `,
    sql<SubscriberRow[]>`
      SELECT id, email, roles, locations, alerts_last_sent_at, onboarded_at
      FROM users
      WHERE email_alerts = true
        AND unsubscribed_at IS NULL
      ORDER BY email ASC
    `,
    sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM users
      WHERE onboarded_at IS NOT NULL
        AND (email_alerts = false OR unsubscribed_at IS NOT NULL)
    `,
  ]);

  const jobs = jobRows.map(jobFromRow);
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const people = new Map<string, AlertSubscriber>();

  for (const row of subscriberRows) {
    people.set(row.id, {
      id: row.id,
      email: row.email,
      roles: cleanList(row.roles),
      locations: cleanList(row.locations),
      subscribedAt: asDate(row.onboarded_at),
      lastSentAt: asDate(row.alerts_last_sent_at),
      jobs: [],
      unmatchedPreferences: [],
    });
  }

  const matchedJobIds = new Set<string>();
  for (const row of matchRows) {
    let person = people.get(row.user_id);
    if (!person) {
      person = {
        id: row.user_id,
        email: row.email,
        roles: cleanList(row.roles),
        locations: cleanList(row.locations),
        subscribedAt: asDate(row.onboarded_at),
        lastSentAt: asDate(row.alerts_last_sent_at),
        jobs: [],
        unmatchedPreferences: [],
      };
      people.set(row.user_id, person);
    }
    const job = jobsById.get(row.job_id) ?? jobFromRow({
      id: row.job_id,
      role: row.job_role,
      venue: row.venue,
      city: row.city,
      country: row.country,
      posted_at: row.posted_at,
      admin_date: row.admin_date,
      description: row.description,
    });
    if (!person.jobs.some((existing) => existing.id === job.id)) person.jobs.push(job);
    matchedJobIds.add(job.id);
  }

  const subscribers = [...people.values()];
  for (const person of subscribers) {
    person.unmatchedPreferences = unmatchedPreferences(person, jobs);
    person.jobs.sort((a, b) => b.adminDate.localeCompare(a.adminDate) || a.role.localeCompare(b.role));
  }
  subscribers.sort((a, b) => a.email.localeCompare(b.email));

  return {
    since,
    recipients: subscribers.filter((person) => person.jobs.length > 0),
    unmatchedSubscribers: subscribers.filter((person) => person.jobs.length === 0),
    quietJobs: jobs.filter((job) => !matchedJobIds.has(job.id)),
    jobCount: jobs.length,
    optedOutCount: Number(optedOutRows[0]?.count ?? 0),
  };
}
