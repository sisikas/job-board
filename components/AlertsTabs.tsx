import Link from "next/link";

const tabs = [
  { href: "/admin/alerts", id: "send", label: "Send Alerts" },
  { href: "/admin/alerts/schedule", id: "schedule", label: "Alerts Schedule" },
  { href: "/admin/alerts/popular", id: "popular", label: "Popular requests" },
] as const;

export function AlertsTabs({ current }: { current: (typeof tabs)[number]["id"] }) {
  return (
    <nav className="mt-5 inline-flex flex-wrap rounded-xl bg-neutral-100 p-1" aria-label="Job alerts">
      {tabs.map((tab) => {
        const active = tab.id === current;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-lg px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-white"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
