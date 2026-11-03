import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { UnsubscribeOnOpen } from "@/components/UnsubscribeOnOpen";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false },
  referrer: "no-referrer",
};

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--brand-cream)" }}>
      <SiteHeader />
      <main className="flex-1 flex justify-center px-4 pb-20">
        <div
          className="mt-10 w-full max-w-sm rounded-2xl p-6 h-fit"
          style={{ background: "var(--brand-card)", border: "1px solid var(--brand-card-border)" }}
        >
          <UnsubscribeOnOpen token={token} />
        </div>
      </main>
    </div>
  );
}
