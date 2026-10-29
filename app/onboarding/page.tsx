import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import OnboardingFlow from "@/components/OnboardingFlow";
import { getCurrentUser, hasCompletedOnboarding } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Welcome — The Good Sort",
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  const finished = user ? await hasCompletedOnboarding(user.id) : false;
  const canSave = Boolean(user) && !finished;

  // On the live site, only a new account that has not finished can open this.
  // Locally it stays open so it can be reviewed without another sign-up.
  if (process.env.NODE_ENV === "production" && !canSave) redirect("/");

  return <OnboardingFlow onComplete={canSave ? completeOnboarding : undefined} />;
}
