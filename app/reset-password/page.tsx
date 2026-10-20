import type { Metadata } from "next";
import { isPasswordResetValid } from "@/lib/users";
import { SiteHeader } from "@/components/SiteHeader";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false },
  // The token is in the URL; keep it out of Referer headers.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const valid = await isPasswordResetValid(token);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--brand-cream)" }}>
      <SiteHeader />
      <main className="flex-1 flex justify-center px-4 pb-20">
        <div
          className="w-full max-w-sm rounded-2xl p-6 h-fit"
          style={{ background: "var(--brand-card)", border: "1px solid var(--brand-card-border)" }}
        >
          <ResetPasswordForm token={token} valid={valid} />
        </div>
      </main>
    </div>
  );
}
