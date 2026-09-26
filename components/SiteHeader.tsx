"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU_LINKS } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name }: { name: "chef" | "shop" | "mail" }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "w-5 h-5 sm:w-6 sm:h-6 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "chef") {
    return (
      <svg {...common}>
        <path d="M8 14c0-3-1.5-5-1.5-7a3.5 3.5 0 0 1 7 0c0 2-1.5 4-1.5 7" />
        <path d="M7 14h10v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2z" />
        <path d="M6 20h12" />
      </svg>
    );
  }

  if (name === "shop") {
    return (
      <svg {...common}>
        <path d="M4 10h16l-1 10H5L4 10z" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="M4 10l2-4h12l2 4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-6 sm:pt-12 flex flex-col items-center">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="The Good Sort"
            className="w-24 sm:w-32 h-auto"
          />
        </Link>
      </div>
      <nav className="mt-5 sm:mt-8 px-4 sm:flex sm:justify-center" aria-label="Main">
        <div
          className="flex w-full max-w-md mx-auto flex-col gap-1 rounded-2xl p-1 sm:w-auto sm:max-w-none sm:flex-row sm:rounded-full"
          style={{ background: "var(--brand-card)" }}
        >
          {MENU_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-[15px] font-semibold sm:w-auto sm:rounded-full sm:px-6 sm:py-2.5 sm:text-lg whitespace-nowrap transition-colors"
                style={{
                  color: active ? "#fff" : "var(--brand-muted)",
                  background: active ? "var(--brand-logo-green)" : "transparent",
                }}
              >
                <NavIcon name={link.icon} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
