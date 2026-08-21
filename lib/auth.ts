import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

function getSecret(): string {
  // Set ADMIN_PASSWORD in your environment before deploying. Falls back to
  // a default only so the app runs out of the box in local dev.
  return process.env.ADMIN_PASSWORD || "changeme";
}

function expectedToken(): string {
  return crypto.createHash("sha256").update(`session:${getSecret()}`).digest("hex");
}

export function checkPassword(password: string): boolean {
  return password === getSecret();
}

export function sessionToken(): string {
  return expectedToken();
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME);
  return !!cookie && cookie.value === expectedToken();
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
