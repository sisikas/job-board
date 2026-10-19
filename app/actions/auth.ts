"use server";

import { redirect } from "next/navigation";
import { createUser, endSession, startSession, verifyUser } from "@/lib/users";

export type AuthState = { error?: string; email?: string } | undefined;

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
  redirect(safeNext(formData.get("next")));
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

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
