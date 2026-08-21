import Link from "next/link";

export default function JobNotFound() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center"
      style={{ background: "var(--brand-cream)" }}
    >
      <h1 className="text-2xl font-bold" style={{ color: "var(--brand-ink)" }}>
        We couldn't find that posting
      </h1>
      <p className="mt-2 text-sm max-w-sm" style={{ color: "var(--brand-muted)" }}>
        It may have been removed, or the link might be off. Take a look at
        the other open positions instead.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1 rounded-full px-5 py-2.5 text-sm font-bold text-white"
        style={{ background: "var(--brand-brick)" }}
      >
        See all positions
      </Link>
    </div>
  );
}
