"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const ITEMS = [
  { href: "/admin/analytics", id: "analytics", label: "Analytics" },
  { href: "/admin/signups", id: "signups", label: "Sign-ups" },
  { href: "/admin/onboarding", id: "emails", label: "Email Lists" },
  { href: "/admin", id: "postings", label: "Job postings" },
] as const;

export function AdminNav({ current }: { current: (typeof ITEMS)[number]["id"] }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {ITEMS.map((item) => {
            const active = item.id === current;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
