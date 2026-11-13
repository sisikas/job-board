import { randomUUID } from "crypto";
import { getSql } from "@/lib/db";

export type EmailBusiness = {
  id: string;
  business: string;
  city: string;
  email: string;
  status: string;
  notes: string;
};

export type EmailBusinessInput = {
  business: string;
  city: string;
  email: string;
  status: string;
  notes: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SHORT_MAX = 200;
const NOTES_MAX = 2000;

type EmailBusinessRow = {
  id: string;
  business: string;
  city: string;
  email: string;
  status: string;
  notes: string;
};

let tableReady: Promise<void> | undefined;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    const sql = getSql();
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS email_businesses (
          id text PRIMARY KEY,
          business text NOT NULL,
          city text NOT NULL DEFAULT '',
          email text NOT NULL,
          status text NOT NULL DEFAULT '',
          notes text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS email_businesses_created_idx
        ON email_businesses (created_at DESC)
      `;
    })().catch((err) => {
      tableReady = undefined;
      throw err;
    });
  }
  return tableReady;
}

function rowToBusiness(row: EmailBusinessRow): EmailBusiness {
  return {
    id: row.id,
    business: row.business,
    city: row.city ?? "",
    email: row.email,
    status: row.status ?? "",
    notes: row.notes ?? "",
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

export function parseEmailBusiness(body: unknown): EmailBusinessInput | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  const business = requiredText(record.business, SHORT_MAX);
  const city = optionalText(record.city, SHORT_MAX);
  const email = requiredText(record.email, SHORT_MAX);
  const status = optionalText(record.status, SHORT_MAX);
  const notes = optionalText(record.notes, NOTES_MAX);
  if (!business || city == null || !email || !EMAIL_RE.test(email) || status == null || notes == null) {
    return null;
  }
  return { business, city, email, status, notes };
}

export async function listEmailBusinesses(): Promise<EmailBusiness[]> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<EmailBusinessRow[]>`
    SELECT id, business, city, email, status, notes
    FROM email_businesses
    ORDER BY created_at DESC, business ASC
  `;
  return rows.map(rowToBusiness);
}

export async function createEmailBusiness(input: EmailBusinessInput): Promise<EmailBusiness> {
  await ensureTable();
  const sql = getSql();
  const id = randomUUID();
  const rows = await sql<EmailBusinessRow[]>`
    INSERT INTO email_businesses (id, business, city, email, status, notes)
    VALUES (${id}, ${input.business}, ${input.city}, ${input.email}, ${input.status}, ${input.notes})
    RETURNING id, business, city, email, status, notes
  `;
  return rowToBusiness(rows[0]);
}

export async function updateEmailBusiness(id: string, input: EmailBusinessInput): Promise<EmailBusiness | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await ensureTable();
  const sql = getSql();
  const rows = await sql<EmailBusinessRow[]>`
    UPDATE email_businesses
    SET business = ${input.business},
        city = ${input.city},
        email = ${input.email},
        status = ${input.status},
        notes = ${input.notes}
    WHERE id = ${id}
    RETURNING id, business, city, email, status, notes
  `;
  return rows[0] ? rowToBusiness(rows[0]) : null;
}

export async function deleteEmailBusiness(id: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  await ensureTable();
  const sql = getSql();
  const rows = await sql<{ id: string }[]>`
    DELETE FROM email_businesses WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}
