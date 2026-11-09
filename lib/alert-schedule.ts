import { getSql } from "@/lib/db";

/**
 * Days an admin has marked on the alert calendar. A row can be ticked as sent,
 * carry a note, or both. The table is created on first use, and `npm run db:setup`
 * creates it too.
 */

export type AlertDay = {
  day: string;
  sent: boolean;
  note: string;
};

const NOTE_MAX = 2000;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

let tableReady: Promise<void> | undefined;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    const sql = getSql();
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS alert_sent_days (
          day date PRIMARY KEY,
          sent boolean NOT NULL DEFAULT true,
          note text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE alert_sent_days ADD COLUMN IF NOT EXISTS sent boolean NOT NULL DEFAULT true`;
      await sql`ALTER TABLE alert_sent_days ADD COLUMN IF NOT EXISTS note text NOT NULL DEFAULT ''`;
    })()
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

export async function listAlertDays(start: string, end: string): Promise<AlertDay[]> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<{ day: string; sent: boolean; note: string }[]>`
    SELECT to_char(day, 'YYYY-MM-DD') AS day, sent, note
    FROM alert_sent_days
    WHERE day >= ${start}::date AND day < ${end}::date
      AND (sent OR note <> '')
    ORDER BY day
  `;
  return rows.map((row) => ({ day: row.day, sent: row.sent, note: row.note ?? "" }));
}

/** Ticks a day on, or clears it if it was already ticked. A note is kept either way. */
export async function toggleAlertSentDay(day: string): Promise<boolean> {
  await ensureTable();
  const sql = getSql();
  const rows = await sql<{ sent: boolean; note: string }[]>`
    SELECT sent, note FROM alert_sent_days WHERE day = ${day}::date
  `;
  if (rows.length === 0) {
    await sql`INSERT INTO alert_sent_days (day, sent) VALUES (${day}::date, true)`;
    return true;
  }
  const next = !rows[0].sent;
  if (!next && !rows[0].note.trim()) {
    await sql`DELETE FROM alert_sent_days WHERE day = ${day}::date`;
    return false;
  }
  await sql`UPDATE alert_sent_days SET sent = ${next} WHERE day = ${day}::date`;
  return next;
}

/** Saves a note for a day. An empty note removes it and keeps the sent tick. */
export async function saveAlertDayNote(day: string, note: string): Promise<string | null> {
  if (!isDay(day)) return null;
  const trimmed = note.trim().slice(0, NOTE_MAX);
  await ensureTable();
  const sql = getSql();
  const rows = await sql<{ sent: boolean }[]>`
    SELECT sent FROM alert_sent_days WHERE day = ${day}::date
  `;
  if (!trimmed) {
    if (rows.length === 0) return "";
    if (rows[0].sent) {
      await sql`UPDATE alert_sent_days SET note = '' WHERE day = ${day}::date`;
    } else {
      await sql`DELETE FROM alert_sent_days WHERE day = ${day}::date`;
    }
    return "";
  }
  if (rows.length === 0) {
    await sql`INSERT INTO alert_sent_days (day, sent, note) VALUES (${day}::date, false, ${trimmed})`;
  } else {
    await sql`UPDATE alert_sent_days SET note = ${trimmed} WHERE day = ${day}::date`;
  }
  return trimmed;
}
