"use server";

import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { deleteJobRequest, updateJobRequestNotes } from "@/lib/job-requests";

export async function deleteJobRequestAction(formData: FormData) {
  if (!(await isAuthed())) return;
  const id = String(formData.get("id") ?? "");
  await deleteJobRequest(id);
  revalidatePath("/admin/requests");
}

export async function saveJobRequestNotesAction(formData: FormData) {
  if (!(await isAuthed())) return;
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  await updateJobRequestNotes(id, notes);
  revalidatePath("/admin/requests");
}
