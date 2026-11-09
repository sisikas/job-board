import Link from "next/link";

const tabs = [
  { href: "/admin/alerts", id: "send", label: "Send Alerts" },
  { href: "/admin/alerts/schedule", id: "schedule", label: "Alerts Schedule" },
] as const;

export function AlertsTabs({ current }: { current: (typeof tabs)[number]["id"] }) {
  return (
    <nav className="mt-6 flex gap-6" aria-label="Job alerts">
      {tabs.map((tab) => {
        const active = tab.id === current;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "border-b-2 border-neutral-900 pb-3 text-sm font-semibold text-neutral-900"
                : "border-b-2 border-transparent pb-3 text-sm font-medium text-neutral-500 hover:text-neutral-800"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
