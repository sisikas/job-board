import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Email designs",
  robots: { index: false, follow: false },
};

const note = [
  "Hiya",
  "found something I think you’ll like.",
  "I’ll send the next one when it’s worth your time.",
  "Kate",
].join("<br>");

const job = {
  role: "Chef",
  venue: "Pollen Bakery",
  place: "Manchester, United Kingdom",
  summary: "A small bakery kitchen. Morning bread, a short savoury list, and a team of four.",
};

const unsub = `<p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#7d7263">Not for you anymore? <a href="https://thegoodsort.vercel.app" style="color:#517228;font-weight:700;text-decoration:none">Unsubscribe</a>. One click, no “are you sure?” pages :)</p>`;

function signature(kind: "current" | "quiet" | "together") {
  const tagline = `<p style="margin:10px 0 0;font-style:italic;color:#517228">Finding Culinary jobs in Incredible Places :)</p>`;
  const links = `<p style="margin:8px 0 0;color:#4082a1"><a href="https://thegoodsort.vercel.app" style="color:#4082a1;text-decoration:none">The Good Sort website</a> · <a href="https://www.instagram.com/the.goodsort/" style="color:#4082a1;text-decoration:none">@the.goodsort</a></p>`;
  if (kind === "together") {
    return `<div style="margin:24px 0 0;line-height:1.5"><p style="margin:0"><span style="font-weight:700;color:#4082a1">Kate</span>, Writer, The Good Sort</p>${tagline}${links}</div>`;
  }
  const name = `<p style="margin:0;font-weight:700;color:#4082a1">Kate</p><p style="margin:2px 0 0">Writer, The Good Sort</p>`;
  if (kind === "current") {
    return `<div style="margin:28px 0 0;line-height:1.5"><p style="margin:0 0 12px">--</p>${name}${tagline}${links}</div>`;
  }
  return `<div style="margin:24px 0 0;line-height:1.5">${name}${tagline}${links}</div>`;
}

function letter() {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#211c14;font-size:16px;line-height:1.55">
      <h1 style="font-size:22px;line-height:1.25;font-weight:700;margin:0 0 16px">New Jobs for you</h1>
      <p style="margin:0 0 24px;font-style:italic;color:#517228">${note}</p>
      <p style="margin:0;font-weight:700">${job.role}</p>
      <p style="margin:2px 0 0;color:#7d7263">${job.venue} · ${job.place}</p>
      <p style="margin:8px 0 0">${job.summary}</p>
      <p style="margin:10px 0 0"><a href="https://thegoodsort.vercel.app" style="color:#517228;font-weight:700">View this job</a></p>
      ${signature("quiet")}
      ${unsub}
    </div>`;
}

function warmPaper() {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#f7e9bd;padding:14px;border-radius:16px">
      <div style="background:#fdfaf6;color:#211c14;border-radius:12px;padding:24px 22px 22px;line-height:1.5">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#517228;font-weight:700">The Good Sort</p>
        <h1 style="font-size:24px;line-height:1.2;font-weight:700;margin:0 0 18px">New Jobs for you</h1>
        <p style="margin:0;font-style:italic;color:#517228">${note}</p>
        <div style="background:#ffffff;border:2px solid #c9b48a;border-radius:12px;padding:20px 18px 18px;margin-top:36px">
          <p style="margin:0;font-weight:700">${job.role}</p>
          <p style="margin:8px 0 0;color:#7d7263">${job.venue} · ${job.place}</p>
          <p style="margin:16px 0 0;font-size:16px;line-height:1.5">${job.summary}</p>
          <p style="margin:20px 0 0"><a href="https://thegoodsort.vercel.app" style="display:inline-block;background:#517228;color:#ffffff;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:999px">View this job</a></p>
        </div>
        <div style="margin:36px 0 0;line-height:1.5"><p style="margin:0;font-weight:700;color:#4082a1">Kate</p><p style="margin:6px 0 0;color:#211c14">Writer, The Good Sort</p><p style="margin:16px 0 0;font-style:italic;color:#517228">Finding Culinary jobs in Incredible Places :)</p></div>
        <p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#7d7263">Not for you anymore? <a href="https://thegoodsort.vercel.app" style="color:#517228;font-weight:700">Unsubscribe</a>. One click, no “are you sure?” pages :)</p>
      </div>
    </div>`;
}

function shortList() {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#211c14;font-size:16px;line-height:1.5">
      <h1 style="font-size:18px;line-height:1.3;font-weight:700;margin:0 0 12px">New Jobs for you</h1>
      <p style="margin:0 0 20px;font-style:italic;color:#517228">${note}</p>
      <p style="margin:0"><span style="font-weight:700;color:#517228">${job.role}</span> <span style="color:#7d7263">· ${job.venue}</span></p>
      <p style="margin:2px 0 0;color:#7d7263;font-size:14px">${job.place}</p>
      <p style="margin:8px 0 0;font-size:14px;line-height:1.45">${job.summary}</p>
      <p style="margin:8px 0 0"><a href="https://thegoodsort.vercel.app" style="color:#517228;font-weight:700;text-decoration:none">View this job</a></p>
      ${signature("together")}
      ${unsub}
    </div>`;
}

function current() {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#211c14">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#517228;font-weight:700">The Good Sort</p>
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 8px">New Jobs for you</h1>
      <div style="margin:0 0 20px;font-style:italic;line-height:1.5;color:#517228"><p style="margin:0">${note}</p></div>
      <div style="border:1px solid #e6e0d6;border-radius:12px;padding:14px 16px;margin:0 0 12px">
        <p style="margin:0;font-weight:700">${job.role}</p>
        <p style="margin:4px 0 0;color:#7d7263">${job.venue} · ${job.place}</p>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.45">${job.summary}</p>
        <p style="margin:12px 0 0"><a href="https://thegoodsort.vercel.app" style="display:inline-block;background:#517228;color:#ffffff;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:999px">View this job</a></p>
      </div>
      ${signature("current")}
      ${unsub}
    </div>`;
}

const designs = [
  {
    title: "A letter",
    why: "This is the one I would send. It looks like Kate typed it, so it sits more naturally in Gmail.",
    html: letter(),
  },
  {
    title: "Warm paper",
    why: "This one looks most like the website: cream paper, the green pill, and the same note.",
    html: warmPaper(),
  },
  {
    title: "A short list",
    why: "This one is the easiest to scan when a person has more than one job.",
    html: shortList(),
  },
  {
    title: "What you have now",
    why: "The box and the pill make this one look more like a newsletter.",
    html: current(),
  },
];

export default function EmailDesignsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="flex-1 bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-xl mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold text-neutral-900">Email designs</h1>
          <p className="mt-1 text-sm text-neutral-600">
            The words are the same in each one. The job is a stand-in so you can judge the layout.
            Subject: 1 new job for you.
          </p>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-8 space-y-10">
        {designs.map((design) => (
          <section key={design.title}>
            <h2 className="text-base font-semibold text-neutral-900">{design.title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{design.why}</p>
            <div className="mt-3 rounded-xl border border-neutral-200 bg-white px-5 py-6">
              <div dangerouslySetInnerHTML={{ __html: design.html }} />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
