import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Keep me posted — The Good Sort",
  description: "Email alerts aren’t live yet. Follow The Good Sort on Instagram so you don’t miss new openings.",
};

export default function AlertsPage() {
  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--brand-cream)" }}>
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-2xl font-bold" style={{ color: "var(--brand-ink)" }}>
          We&apos;ll nudge you when it&apos;s ready.
        </h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--brand-muted)" }}>
          Email alerts aren&apos;t live yet. Follow{" "}
          <a
            href="https://www.instagram.com/the.goodsort/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
            style={{ color: "var(--brand-logo-green)" }}
          >
            @the.goodsort
          </a>{" "}
          so you don&apos;t miss new openings.
        </p>
      </main>
    </div>
  );
}
