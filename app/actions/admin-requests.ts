"use server";

import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { deleteJobRequest } from "@/lib/job-requests";

export async function deleteJobRequestAction(formData: FormData) {
  if (!(await isAuthed())) return;
  const id = String(formData.get("id") ?? "");
  await deleteJobRequest(id);
  revalidatePath("/admin/requests");
}
