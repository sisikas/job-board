"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  createPasswordReset,
  createUser,
  endSession,
  resetPassword,
  startSession,
  verifyUser,
} from "@/lib/users";

export type AuthState =
  | { error?: string; email?: string; sent?: boolean; signedUp?: boolean; next?: string }
  | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Only same-site paths, so the redirect can't be pointed at another website.
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address.", email };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`, email };
  }

  const user = await createUser(email, password);
  if (!user) {
    return { error: "There's already an account with this email. Try logging in instead.", email };
  }

  await startSession(user.id);
  return { signedUp: true, next: safeNext(formData.get("next")) };
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!email || !password) {
    return { error: "Please enter your email and password.", email };
  }

  const user = await verifyUser(email, password);
  if (!user) {
    return { error: "That email and password don't match.", email };
  }

  await startSession(user.id);
  redirect(safeNext(formData.get("next")));
}

async function siteUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Always answers "sent", whether or not the account exists, so the form can't
// be used to find out who has signed up.
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address.", email };
  }

  const reset = await createPasswordReset(email);
  if (reset) {
    const link = `${await siteUrl()}/reset-password?token=${encodeURIComponent(reset.token)}`;
    try {
      await sendPasswordResetEmail(reset.email, link);
    } catch (err) {
      console.error("Password reset email failed:", err);
      return { error: "We couldn't send the email right now. Please try again in a few minutes.", email };
    }
  }
  return { sent: true, email };
}

export async function completePasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) {
    return { error: "The two passwords don't match." };
  }

  const user = await resetPassword(token, password);
  if (!user) {
    return { error: "This reset link has expired or was already used. Please ask for a new one." };
  }

  await startSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
