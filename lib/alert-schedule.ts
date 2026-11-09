import { getSql } from "@/lib/db";

/**
 * Days an admin has marked as "an alert went out". A missing day means it
 * has not been sent. The table is created on first use, and `npm run db:setup`
 * creates it too.
 */

const DAY = /^\d{4}-\d{2}-\d{2}$/;

let tableReady: Promise<void> | undefined;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    const sql = getSql();
    tableReady = sql`
      CREATE TABLE IF NOT EXISTS alert_sent_days (
        day date PRIMARY KEY,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `
      .then(() => undefined)
      .catch((err) => {
        tableReady = undefined;
        throw err;
      });
  }
  return tableReady;
}

export function isDay(value: string): boolean {
  if (!DAY.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export async function listAlertSentDays(start: string, end: string): Promise<string[]> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<{ day: string }[]>`
    SELECT to_char(day, 'YYYY-MM-DD') AS day
    FROM alert_sent_days
    WHERE day >= ${start}::date AND day < ${end}::date
    ORDER BY day
  `;
  return rows.map((row) => row.day);
}

/** Ticks a day on, or clears it if it was already ticked. Returns whether it is now sent. */
export async function toggleAlertSentDay(day: string): Promise<boolean> {
  await ensureTable();
  const sql = getSql();
  const removed = await sql<{ day: string }[]>`
    DELETE FROM alert_sent_days WHERE day = ${day}::date RETURNING to_char(day, 'YYYY-MM-DD') AS day
  `;
  if (removed.length > 0) return false;
  await sql`INSERT INTO alert_sent_days (day) VALUES (${day}::date)`;
  return true;
}
