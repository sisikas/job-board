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
  if (!user) redirect("/");
  if (await hasCompletedOnboarding(user.id)) redirect("/");

  return (
    <OnboardingFlow jobsHref="/" onComplete={completeOnboarding} />
  );
}
