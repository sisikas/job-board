"use server";

import { revalidatePath } from "next/cache";
import { unsubscribeByToken } from "@/lib/users";

/** Public one-click unsubscribe. The token in the email is the only credential. */
export async function unsubscribeFromAlerts(token: string): Promise<boolean> {
  const ok = await unsubscribeByToken(token);
  if (ok) {
    revalidatePath("/admin/onboarding");
    revalidatePath("/admin/alerts");
  }
  return ok;
}
