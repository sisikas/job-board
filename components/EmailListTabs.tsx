import Link from "next/link";

const tabs = [
  { href: "/admin/onboarding", id: "subscribers", label: "Email subscribers" },
  { href: "/admin/onboarding/businesses", id: "businesses", label: "Email businesses" },
] as const;

export function EmailListTabs({ current }: { current: (typeof tabs)[number]["id"] }) {
  return (
    <nav className="mt-5 inline-flex flex-wrap rounded-xl bg-neutral-100 p-1" aria-label="Email lists">
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
