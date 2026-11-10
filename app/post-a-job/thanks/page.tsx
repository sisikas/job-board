import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { PostJobThanks } from "@/components/PostJobThanks";

export const metadata: Metadata = {
  title: "It's in — The Good Sort",
  description: "We’ll process the ad and come back to you within a day.",
};

export default function PostJobThanksPage() {
  return (
    <div className="flex-1" style={{ background: "var(--brand-cream)", color: "#231F17" }}>
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 pt-6 pb-20">
        <PostJobThanks />
      </div>
    </div>
  );
}
