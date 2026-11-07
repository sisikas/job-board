"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const ITEMS = [
  { href: "/admin/analytics", id: "analytics", label: "Analytics" },
  { href: "/admin/signups", id: "signups", label: "Sign-ups" },
  { href: "/admin/onboarding", id: "emails", label: "Email Lists" },
  { href: "/admin/alerts", id: "alerts", label: "Alerts" },
  { href: "/admin/instagram", id: "instagram", label: "Insta schedule" },
  { href: "/admin/requests", id: "requests", label: "Job requests" },
  { href: "/admin", id: "postings", label: "Job postings" },
] as const;

const STORAGE_KEY = "tgs-admin-nav";

function activeId(path: string) {
  if (path.startsWith("/admin/analytics")) return "analytics";
  if (path.startsWith("/admin/signups")) return "signups";
  if (path.startsWith("/admin/onboarding")) return "emails";
  if (path.startsWith("/admin/alerts")) return "alerts";
  if (path.startsWith("/admin/instagram")) return "instagram";
  if (path.startsWith("/admin/requests")) return "requests";
  return "postings";
}

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function ItemIcon({ id }: { id: (typeof ITEMS)[number]["id"] | "logout" }) {
  if (id === "analytics") {
    return (
      <Glyph>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15l3.5-4 2.5 2.5L19 8" />
      </Glyph>
    );
  }
  if (id === "signups") {
    return (
      <Glyph>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.2-3 3.4-4.5 7-4.5S17.8 16 19 19" />
      </Glyph>
    );
  }
  if (id === "emails") {
    return (
      <Glyph>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </Glyph>
    );
  }
  if (id === "alerts") {
    return (
      <Glyph>
        <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </Glyph>
    );
  }
  if (id === "requests") {
    return (
      <Glyph>
        <path d="M6 7h12" />
        <path d="M6 12h12" />
        <path d="M6 17h7" />
      </Glyph>
    );
  }
  if (id === "instagram") {
    return (
      <Glyph>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.25" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </Glyph>
    );
  }
  if (id === "logout") {
    return (
      <Glyph>
        <path d="M10 7V5.5A1.5 1.5 0 0 1 11.5 4h7A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 10 18.5V17" />
        <path d="M4 12h10" />
        <path d="M11 9l3 3-3 3" />
      </Glyph>
    );
  }
  return (
    <Glyph>
      <rect x="4" y="7" width="16" height="12" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
    </Glyph>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const current = activeId(pathname);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "1" || saved === "0") {
      setCollapsed(saved === "1");
      return;
    }
    setCollapsed(window.matchMedia("(max-width: 767px)").matches);
  }, []);

  function toggle() {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <aside
      className={
        "sticky top-0 z-20 flex h-dvh shrink-0 flex-col self-start overflow-visible border-r border-neutral-200 bg-white transition-[width] duration-200 " +
        (collapsed ? "w-16" : "w-56")
      }
    >
      <div className="relative h-14 shrink-0">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          className="absolute top-1/2 -right-3 z-30 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={"h-3.5 w-3.5 " + (collapsed ? "" : "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2" aria-label="Admin">
        {ITEMS.map((item) => {
          const active = item.id === current;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              className={
                "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 " +
                (collapsed ? "justify-center px-0 " : "px-3 ") +
                (active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100")
              }
            >
              <ItemIcon id={item.id} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 py-3">
        <button
          type="button"
          onClick={logout}
          aria-label={collapsed ? "Log out" : undefined}
          title={collapsed ? "Log out" : undefined}
          className={
            "flex h-10 w-full items-center gap-3 rounded-lg text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 " +
            (collapsed ? "justify-center px-0" : "px-3")
          }
        >
          <ItemIcon id="logout" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
