"use server";

import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { deleteUserByEmail } from "@/lib/users";

export async function deleteSignup(formData: FormData) {
  if (!(await isAuthed())) return;
  const email = String(formData.get("email") ?? "");
  await deleteUserByEmail(email);
  revalidatePath("/admin/signups");
  revalidatePath("/admin/onboarding");
}
