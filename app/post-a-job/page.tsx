import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { PostJobForm } from "@/components/PostJobForm";

export const metadata: Metadata = {
  title: "Post a job — The Good Sort",
  description:
    "We look at every job before it goes live. This keeps the board full of good places, which is why good people keep checking it! We’ll review and be in touch within a day.",
};

const MONTHLY = "mailto:thegoodsort.jobs@gmail.com?subject=Monthly%20plan";
const STRIPE_PAYMENT_URL = "https://buy.stripe.com/cNi4gsbK9axX2qUclk3wQ00";

export default function PostJobPage() {
  return (
    <div className="flex-1" style={{ background: "var(--brand-cream)", color: "#231F17" }}>
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 pt-2 pb-20 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Post a job</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed" style={{ color: "#5C5140" }}>
            We look at every job before it goes live. This keeps the board full of good places,
            which is why good people keep checking it! We’ll review and be in touch within a day.
          </p>
          <div className="mt-6">
            <PostJobForm />
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:pt-[7.5rem]">
          <div className="rounded-3xl px-5 py-5 text-white" style={{ background: "#4E6B1F" }}>
            <h2 className="text-base font-bold">A few house rules</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm leading-snug text-white">
              <li>Helps to say what it pays</li>
              <li>Real kitchens only, no agencies</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 px-1 text-sm leading-relaxed" style={{ color: "#5C5140" }}>
            <p>
              Hiring across a few sites?{" "}
              <a href={MONTHLY} className="font-semibold underline underline-offset-2" style={{ color: "#4E6B1F" }}>
                Ask about a monthly plan.
              </a>
            </p>
            <p>
              Already talked with us?{" "}
              <a
                href={STRIPE_PAYMENT_URL}
                className="font-semibold underline underline-offset-2"
                style={{ color: "#4E6B1F" }}
              >
                Here’s the last step.
              </a>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
