"use server";

import { getCurrentUser, saveUserOnboarding } from "@/lib/users";

export async function completeOnboarding(result: {
  roles: string[];
  locations: string[];
  emailAlerts: boolean;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Log in again.");
    await saveUserOnboarding(user.id, {
      roles: result.roles,
      locations: result.locations,
      emailAlerts: result.emailAlerts,
    });
  } catch (error) {
    console.error("Onboarding could not be saved.", error);
  }
}
