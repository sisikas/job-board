export function InstagramLink({
  href,
  venueName,
  color = "var(--brand-ink)",
}: {
  href: string;
  venueName: string;
  color?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${venueName} on Instagram`}
      className="inline-flex items-center justify-center rounded-xl p-1.5 transition-opacity hover:opacity-80"
      style={{ color }}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    </a>
  );
}
