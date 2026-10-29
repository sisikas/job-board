import crypto from "crypto";
import { promisify } from "util";
import { cache } from "react";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";

/**
 * Job-seeker accounts (separate from the single-password /admin login in
 * lib/auth.ts). Passwords are hashed with scrypt; sessions are random tokens
 * kept in an httpOnly cookie, with only their SHA-256 stored in the database
 * so a leaked table can't be replayed as live logins.
 */

const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const SESSION_COOKIE = "tgs_session";
const SESSION_DAYS = 30;

export type User = { id: string; email: string };

let tablesReady: Promise<void> | undefined;

// The tables are created on first use so a fresh deploy works without a
// manual migration step; `npm run db:setup` creates them too.
function ensureTables(): Promise<void> {
  if (!tablesReady) {
    const sql = getSql();
    tablesReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id            text PRIMARY KEY,
          email         text NOT NULL UNIQUE,
          password_hash text NOT NULL,
          created_at    timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash text PRIMARY KEY,
          user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at timestamptz NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS password_resets (
          token_hash text PRIMARY KEY,
          user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at timestamptz NOT NULL DEFAULT now(),
          expires_at timestamptz NOT NULL
        )
      `;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT '{}'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS locations text[] NOT NULL DEFAULT '{}'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_alerts boolean NOT NULL DEFAULT false`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at timestamptz`;
    })().catch((err) => {
      tablesReady = undefined;
      throw err;
    });
  }
  return tablesReady;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Returns null if an account with this email already exists. */
export async function createUser(email: string, password: string): Promise<User | null> {
  await ensureTables();
  const sql = getSql();
  const user: User = { id: crypto.randomUUID(), email: normalizeEmail(email) };
  const passwordHash = await hashPassword(password);

  const rows = await sql`
    INSERT INTO users (id, email, password_hash)
    VALUES (${user.id}, ${user.email}, ${passwordHash})
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `;
  return rows.length > 0 ? user : null;
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
  await ensureTables();
  const sql = getSql();
  const rows = await sql<{ id: string; email: string; password_hash: string }[]>`
    SELECT id, email, password_hash FROM users WHERE email = ${normalizeEmail(email)} LIMIT 1
  `;
  const row = rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) return null;
  return { id: row.id, email: row.email };
}

export async function startSession(userId: string): Promise<void> {
  await ensureTables();
  const sql = getSql();
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${expiresAt})
  `;

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureTables();
    await getSql()`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  store.delete(SESSION_COOKIE);
}

const RESET_MINUTES = 60;
const RESET_COOLDOWN_SECONDS = 60;

/**
 * Issues a single-use reset token for this email. Returns null when there's
 * no such account, or when a link was already sent in the last minute (so the
 * form can't be used to flood someone's inbox).
 */
export async function createPasswordReset(
  email: string
): Promise<{ email: string; token: string } | null> {
  await ensureTables();
  const sql = getSql();
  const users = await sql<{ id: string; email: string }[]>`
    SELECT id, email FROM users WHERE email = ${normalizeEmail(email)} LIMIT 1
  `;
  const user = users[0];
  if (!user) return null;

  const recent = await sql`
    SELECT 1 FROM password_resets
    WHERE user_id = ${user.id}
      AND created_at > now() - make_interval(secs => ${RESET_COOLDOWN_SECONDS})
    LIMIT 1
  `;
  if (recent.length > 0) return null;

  const token = crypto.randomBytes(32).toString("base64url");
  await sql.begin(async (tx) => {
    await tx`DELETE FROM password_resets WHERE user_id = ${user.id}`;
    await tx`
      INSERT INTO password_resets (token_hash, user_id, expires_at)
      VALUES (${hashToken(token)}, ${user.id}, now() + make_interval(mins => ${RESET_MINUTES}))
    `;
  });
  return { email: user.email, token };
}

export async function isPasswordResetValid(token: string): Promise<boolean> {
  if (!token) return false;
  await ensureTables();
  const rows = await getSql()`
    SELECT 1 FROM password_resets
    WHERE token_hash = ${hashToken(token)} AND expires_at > now()
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Uses up the token and sets the new password. Every existing session for the
 * account is ended, so anyone else logged in with the old password is kicked out.
 */
export async function resetPassword(token: string, newPassword: string): Promise<User | null> {
  if (!token) return null;
  await ensureTables();
  const passwordHash = await hashPassword(newPassword);

  return getSql().begin(async (tx) => {
    const used = await tx<{ user_id: string }[]>`
      DELETE FROM password_resets
      WHERE token_hash = ${hashToken(token)} AND expires_at > now()
      RETURNING user_id
    `;
    const userId = used[0]?.user_id;
    if (!userId) return null;

    const users = await tx<User[]>`
      UPDATE users SET password_hash = ${passwordHash}
      WHERE id = ${userId}
      RETURNING id, email
    `;
    await tx`DELETE FROM password_resets WHERE user_id = ${userId}`;
    await tx`DELETE FROM sessions WHERE user_id = ${userId}`;
    return users[0] ?? null;
  });
}

export type SignupRow = { email: string; createdAt: Date; inLastWeek: boolean };

export type OnboardingAnswer = {
  email: string;
  roles: string[];
  locations: string[];
  emailAlerts: boolean;
  onboardedAt: Date;
};

/** Removes a job-seeker account. Sessions and password resets go with it. Admin-only. */
export async function deleteUserByEmail(email: string): Promise<boolean> {
  await ensureTables();
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const rows = await getSql()`
    DELETE FROM users WHERE email = ${normalized} RETURNING 1
  `;
  return rows.length > 0;
}

/** Every job-seeker account, newest first. Admin-only — callers must check isAuthed(). */
export async function listSignups(): Promise<SignupRow[]> {
  await ensureTables();
  const rows = await getSql()<{ email: string; created_at: Date; in_last_week: boolean }[]>`
    SELECT email, created_at, created_at >= now() - interval '7 days' AS in_last_week
    FROM users
    ORDER BY created_at DESC
  `;
  return rows.map((row) => ({
    email: row.email,
    createdAt: row.created_at,
    inLastWeek: row.in_last_week,
  }));
}

/** Answers from people who finished onboarding, newest first. Admin-only. */
export async function listOnboardingAnswers(): Promise<OnboardingAnswer[]> {
  await ensureTables();
  const rows = await getSql()<
    {
      email: string;
      roles: string[] | null;
      locations: string[] | null;
      email_alerts: boolean;
      onboarded_at: Date;
    }[]
  >`
    SELECT email, roles, locations, email_alerts, onboarded_at
    FROM users
    WHERE onboarded_at IS NOT NULL
    ORDER BY onboarded_at DESC
  `;
  return rows.map((row) => ({
    email: row.email,
    roles: row.roles ?? [],
    locations: row.locations ?? [],
    emailAlerts: row.email_alerts,
    onboardedAt: row.onboarded_at,
  }));
}

function cleanChoices(values: string[]) {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const value of values) {
    const trimmed = value.trim().slice(0, 80);
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key) || cleaned.length >= 20) continue;
    seen.add(key);
    cleaned.push(trimmed);
  }
  return cleaned;
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  await ensureTables();
  const rows = await getSql()<{ onboarded_at: Date | null }[]>`
    SELECT onboarded_at FROM users WHERE id = ${userId} LIMIT 1
  `;
  return Boolean(rows[0]?.onboarded_at);
}

export async function saveUserOnboarding(
  userId: string,
  input: { roles: string[]; locations: string[]; emailAlerts: boolean }
): Promise<void> {
  await ensureTables();
  const roles = cleanChoices(input.roles);
  const locations = cleanChoices(input.locations);
  await getSql()`
    UPDATE users
    SET roles = ${roles},
        locations = ${locations},
        email_alerts = ${input.emailAlerts === true},
        onboarded_at = now()
    WHERE id = ${userId}
  `;
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await ensureTables();
  const rows = await getSql()<User[]>`
    SELECT u.id, u.email
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
    LIMIT 1
  `;
  return rows[0] ?? null;
});
