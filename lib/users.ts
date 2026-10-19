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
