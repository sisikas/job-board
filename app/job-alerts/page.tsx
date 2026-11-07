import Link from "next/link";
import { completeOnboarding } from "@/app/actions/onboarding";
import { JobAlertSignup } from "@/components/JobAlertSignup";
import OnboardingFlow from "@/components/OnboardingFlow";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser, getJobAlertProfile } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Job alerts — The Good Sort",
};

export default async function JobAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex-1" style={{ background: "var(--brand-cream)", color: "#231F17" }}>
        <SiteHeader />
        <JobAlertSignup />
      </div>
    );
  }

  const profile = await getJobAlertProfile(user.id);
  const receiving = Boolean(profile?.emailAlerts && !profile.unsubscribed);
  const editing = (await searchParams).edit === "1";

  if (!receiving || editing) {
    return (
      <OnboardingFlow
        onComplete={completeOnboarding}
        initialRoles={profile?.roles ?? []}
        initialLocations={profile?.locations ?? []}
        preferencesOnly={receiving && editing}
      />
    );
  }

  return (
    <div className="flex-1" style={{ background: "var(--brand-cream)", color: "#231F17" }}>
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 pt-4 pb-20">
        <h1 className="text-4xl font-bold tracking-tight">You&apos;re already getting job alerts.</h1>
        <p className="mt-3 text-base leading-relaxed" style={{ color: "#5C5140" }}>
          We&apos;ll email you when a job matches what you asked for. Want to change your roles or
          locations?
        </p>
        <PreferenceList label="Roles" values={profile?.roles ?? []} />
        <PreferenceList label="Locations" values={profile?.locations ?? []} />
        <Link
          href="/job-alerts?edit=1"
          className="mt-8 inline-block rounded-full px-5 py-2.5 text-sm font-bold text-white"
          style={{ background: "var(--brand-logo-green)" }}
        >
          Change my roles or locations
        </Link>
      </div>
    </div>
  );
}

function PreferenceList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold">{label}</h2>
      <p className="mt-1 text-base" style={{ color: "#5C5140" }}>
        {values.length > 0 ? values.join(", ") : "None yet"}
      </p>
    </div>
  );
}
