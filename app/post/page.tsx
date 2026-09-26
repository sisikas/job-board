import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "I'm hiring — The Good Sort",
  description: "Posting a role on The Good Sort isn’t ready yet. Message us on Instagram and we’ll help you share it.",
};

export default function PostPage() {
  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--brand-cream)" }}>
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-2xl font-bold" style={{ color: "var(--brand-ink)" }}>
          This bit is still in the kitchen.
        </h1>
        <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--brand-muted)" }}>
          You can&apos;t post a job on the site just yet. Message{" "}
          <a
            href="https://www.instagram.com/the.goodsort/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
            style={{ color: "var(--brand-logo-green)" }}
          >
            @the.goodsort
          </a>{" "}
          and we&apos;ll get your role in front of people.
        </p>
      </main>
    </div>
  );
}
