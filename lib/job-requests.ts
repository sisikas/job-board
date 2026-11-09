import { randomUUID } from "crypto";
import { getSql } from "@/lib/db";

/**
 * Submissions from the public Post a job form. The table is created on first
 * use, and `npm run db:setup` creates it too. Only a logged-in admin can read
 * the rows.
 */

export type JobRequest = {
  id: string;
  email: string;
  business: string;
  role: string;
  city: string;
  pay: string;
  description: string;
  about: string;
  apply: string;
  createdAt: string;
};

export type JobRequestInput = {
  email: string;
  business: string;
  role: string;
  city: string;
  pay: string;
  description: string;
  about: string;
  apply: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SHORT_MAX = 200;
const LONG_MAX = 5000;

type JobRequestRow = {
  id: string;
  email: string;
  business: string;
  role: string;
  city: string;
  pay: string;
  description: string;
  about: string;
  apply: string;
  created_at: Date | string;
};

let tableReady: Promise<void> | undefined;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    const sql = getSql();
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS job_requests (
          id text PRIMARY KEY,
          email text NOT NULL,
          business text NOT NULL,
          role text NOT NULL,
          city text NOT NULL,
          pay text NOT NULL DEFAULT '',
          description text NOT NULL,
          about text NOT NULL,
          apply text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS job_requests_created_idx
        ON job_requests (created_at DESC)
      `;
    })().catch((err) => {
      tableReady = undefined;
      throw err;
    });
  }
  return tableReady;
}

function stamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

function rowToRequest(row: JobRequestRow): JobRequest {
  return {
    id: row.id,
    email: row.email,
    business: row.business,
    role: row.role,
    city: row.city,
    pay: row.pay ?? "",
    description: row.description,
    about: row.about,
    apply: row.apply,
    createdAt: stamp(row.created_at),
  };
}

function requiredText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function optionalText(value: unknown, max: number): string | null {
  if (value == null) return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > max) return null;
  return trimmed;
}

export function parseJobRequest(body: unknown): JobRequestInput | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  const email = requiredText(record.email, SHORT_MAX);
  const business = requiredText(record.business, SHORT_MAX);
  const role = requiredText(record.role, SHORT_MAX);
  const city = requiredText(record.city, SHORT_MAX);
  const pay = optionalText(record.pay, SHORT_MAX);
  const description = requiredText(record.description, LONG_MAX);
  const about = requiredText(record.about, LONG_MAX);
  const apply = requiredText(record.apply, SHORT_MAX);
  if (!email || !EMAIL_RE.test(email) || !business || !role || !city || pay == null || !description || !about || !apply) {
    return null;
  }
  return { email, business, role, city, pay, description, about, apply };
}

export async function createJobRequest(input: JobRequestInput): Promise<JobRequest> {
  await ensureTable();
  const sql = getSql();
  const id = randomUUID();
  const rows = await sql<JobRequestRow[]>`
    INSERT INTO job_requests (
      id, email, business, role, city, pay, description, about, apply
    ) VALUES (
      ${id}, ${input.email}, ${input.business}, ${input.role}, ${input.city},
      ${input.pay}, ${input.description}, ${input.about}, ${input.apply}
    )
    RETURNING id, email, business, role, city, pay, description, about, apply, created_at
  `;
  return rowToRequest(rows[0]);
}

export async function deleteJobRequest(id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  await ensureTable();
  const sql = getSql();
  const rows = await sql<{ id: string }[]>`
    DELETE FROM job_requests WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}

export async function listJobRequests(): Promise<JobRequest[]> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<JobRequestRow[]>`
    SELECT id, email, business, role, city, pay, description, about, apply, created_at
    FROM job_requests
    ORDER BY created_at DESC
  `;
  return rows.map(rowToRequest);
}
