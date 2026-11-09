"use server";

import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { isDay, saveAlertDayNote, toggleAlertSentDay } from "@/lib/alert-schedule";

export async function toggleAlertDay(day: string): Promise<boolean | null> {
  if (!(await isAuthed())) return null;
  if (!isDay(day)) return null;
  const sent = await toggleAlertSentDay(day);
  revalidatePath("/admin/alerts/schedule");
  return sent;
}

export async function saveAlertNote(day: string, note: string): Promise<string | null> {
  if (!(await isAuthed())) return null;
  if (!isDay(day)) return null;
  const saved = await saveAlertDayNote(day, note);
  revalidatePath("/admin/alerts/schedule");
  return saved;
}
