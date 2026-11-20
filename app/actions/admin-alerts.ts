"use server";

import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { clearAlertsSent, markAlertsSent } from "@/lib/alerts";

export async function markAlertsSentAction(formData: FormData) {
  if (!(await isAuthed())) return;
  if (formData.get("mode") === "clear") {
    await clearAlertsSent(formData.getAll("id").map((value) => String(value)));
  } else {
    const pairs = formData.getAll("sent").flatMap((value) => {
      const [userId, jobId] = String(value).split("|");
      if (!userId || !jobId) return [];
      return [{ userId, jobId }];
    });
    await markAlertsSent(pairs);
  }
  revalidatePath("/admin/alerts");
}
