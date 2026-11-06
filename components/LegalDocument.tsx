import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export function MailLink() {
  return <a href="mailto:thegoodsort.jobs@gmail.com">thegoodsort.jobs@gmail.com</a>;
}

export function LegalDocument({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex-1" style={{ background: "var(--brand-cream)", color: "var(--brand-ink)" }}>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pt-2 pb-16">
        <div className="rounded-3xl px-6 py-10 sm:px-10" style={{ background: "var(--brand-card)" }}>
          <h1 className="text-3xl font-bold">{title}</h1>
          <div
            className="mt-4 space-y-3 text-[17px] leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:mb-1 [&_h2]:text-[22px] [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
            style={{ color: "#3D3628" }}
          >
            {children}
          </div>
        </div>
      </article>
    </div>
  );
}

export function LegalMeta({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 border-t pt-5 text-sm" style={{ borderColor: "#E9DCB5", color: "#6B5F48" }}>
      The Good Sort is operated by Stubborn Panda Ltd, registered in England and Wales, company
      number 15721533. · {children}
    </p>
  );
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href}>{children}</Link>;
}
