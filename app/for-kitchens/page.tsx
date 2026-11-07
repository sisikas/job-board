import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "For kitchens — The Good Sort",
  description:
    "Your job goes straight to professionals who follow The Good Sort and live for good food. One flat price, no agency cut.",
};

function Tick() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F6E8BB"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-px shrink-0"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4E6B1F"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4E6B1F"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4E6B1F"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 17v5" />
      <path d="M9 10.76V6h6v4.76l3 3.24H6z" />
      <path d="M8 2h8" />
    </svg>
  );
}

const pricePoints = [
  "Your job, seen by the right crowd",
  "Live for 30 days",
  "Sent to our own community of chefs",
  "No subscription, no recruiter fees",
];

const featured = [
  {
    icon: <MailIcon />,
    title: "Straight to inboxes",
    body: "Sent in our job alerts to chefs",
  },
  {
    icon: <InstagramIcon />,
    title: "On our Instagram",
    body: "A dedicated post on our Instagram, where our community of chefs and culinary talent finds its next move.",
  },
  {
    icon: <PinIcon />,
    title: "Top of the site",
    body: "Pinned to the top of your city for 30 days",
  },
];

const steps = [
  {
    title: "Tell us about the job",
    body: "Role, pay, hours, and what the food’s like. Two minutes, tops.",
  },
  {
    title: "We have a look",
    body: "We only list kitchens we’d send a friend to. Most get in. Some don’t. That’s sort of the point.",
  },
  {
    title: "Chefs & culinary talent apply to you",
    body: "Directly, by email or your own link. No middleman taking a cut.",
  },
];

const questions = [
  {
    title: "Do chefs pay anything?",
    body: "No. Never have, never will.",
  },
  {
    title: "Who do you say no to?",
    body: "Agencies, vague listings with no pay, and anywhere we wouldn’t eat.",
  },
  {
    title: "Any hidden fees?",
    body: "None. £39 is the whole bill. No add-ons, no auto-renewals, no cut of anyone’s salary. You pay by card once your job’s approved.",
  },
  {
    title: "What kind of places do you list?",
    body: "Chef-led independents, bakeries, coffee spots and good neighbourhood restaurants. If it has a point of view on the plate, we’re interested.",
  },
  {
    title: "Why does being picky help me?",
    body: "Because people trust it. Chefs and culinary talent know every job on The Good Sort is worth a look, so they actually read yours.",
  },
];

export default function ForKitchensPage() {
  return (
    <div className="flex-1" style={{ background: "#F6E8BB", color: "#231F17" }}>
      <SiteHeader />
      <div className="mx-auto flex max-w-[1180px] flex-col gap-10 px-6 pt-2 pb-20">
        <section
          className="flex flex-wrap items-center gap-10 rounded-[28px] px-6 py-10 sm:px-12 sm:py-14"
          style={{ background: "#FCFAF4" }}
        >
          <div className="flex min-w-[min(100%,420px)] flex-1 flex-col gap-5">
            <p className="text-sm font-bold tracking-[0.08em] uppercase" style={{ color: "#4E6B1F" }}>
              For kitchens
            </p>
            <h1 className="max-w-[9.4em] text-[clamp(40px,4.8vw,56px)] leading-[1.02] font-bold tracking-[-0.02em]">
              We’re fussy about kitchens. Chefs love us for it.
            </h1>
            <p className="max-w-[460px] text-[17px] leading-relaxed" style={{ color: "#5C5140" }}>
              Your job goes straight to professionals who follow The Good Sort and live for good
              food. In their inbox, on our Instagram, and on the site. One flat price, no agency
              cut.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href="/post-a-job"
                className="rounded-full px-6 py-3.5 text-[16px] font-bold text-white"
                style={{ background: "#4E6B1F" }}
              >
                Post a job · £39
              </Link>
              <a
                href="#featured"
                className="rounded-full border-2 bg-transparent px-6 py-3 text-[16px] font-bold"
                style={{ borderColor: "#4E6B1F", color: "#4E6B1F" }}
              >
                See where it goes
              </a>
            </div>
          </div>
          <aside
            className="flex w-full max-w-[360px] flex-col rounded-[24px] px-7 py-8 text-white"
            style={{ background: "#4E6B1F" }}
          >
            <p className="text-[26px] leading-[1.15] font-bold tracking-[-0.02em]">
              Not for everyone.
              <br />
              Just the good ones.
            </p>
            <ul className="mt-5 flex flex-col gap-3 text-[15px] leading-snug">
              {pricePoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <Tick />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t pt-4" style={{ borderColor: "#7A9447" }}>
              <p className="text-[15px]" style={{ color: "#E8EFD9" }}>
                One flat price, no hidden costs
              </p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-[28px] leading-none font-bold">£39</span>
                <span className="text-[17px]">per job</span>
              </p>
            </div>
          </aside>
        </section>

        <section id="featured" className="flex scroll-mt-6 flex-col gap-5">
          <h2 className="text-[32px] font-bold">Where a Featured job goes</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-2.5 rounded-[20px] p-7"
                style={{ background: "#FCFAF4" }}
              >
                {item.icon}
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="leading-relaxed" style={{ color: "#5C5140" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-[32px] font-bold">How it works</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-2.5 rounded-[20px] p-7"
                style={{ background: "#FCFAF4" }}
              >
                <div className="font-serif text-[40px] leading-none" style={{ color: "#4E6B1F" }}>
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="leading-relaxed" style={{ color: "#5C5140" }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="flex flex-col gap-6 rounded-3xl px-6 py-8 sm:px-8 sm:py-10"
          style={{ background: "#FCFAF4" }}
        >
          <h2 className="text-[32px] font-bold">Fair questions</h2>
          <div className="grid gap-7 sm:grid-cols-2">
            {questions.map((item) => (
              <div key={item.title}>
                <h3 className="mb-1.5 text-lg font-semibold">{item.title}</h3>
                <p className="leading-relaxed" style={{ color: "#5C5140" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="flex flex-col items-center gap-4 rounded-[28px] px-6 py-14 text-center text-white sm:px-8"
          style={{ background: "#4E6B1F" }}
        >
          <h2 className="max-w-[18em] text-balance text-[40px] leading-tight font-bold">
            Put your job in front of the right people this week
          </h2>
          <Link
            href="/post-a-job"
            className="rounded-full px-7 py-4 text-[17px] font-bold"
            style={{ background: "#F6E8BB", color: "#2E3F12" }}
          >
            Post a job
          </Link>
        </section>
      </div>
    </div>
  );
}
