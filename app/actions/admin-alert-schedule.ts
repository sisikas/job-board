"use server";

import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { isDay, toggleAlertSentDay } from "@/lib/alert-schedule";

export async function toggleAlertDay(day: string): Promise<boolean | null> {
  if (!(await isAuthed())) return null;
  if (!isDay(day)) return null;
  const sent = await toggleAlertSentDay(day);
  revalidatePath("/admin/alerts/schedule");
  return sent;
}
