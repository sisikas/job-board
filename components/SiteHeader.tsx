"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MENU_LINKS } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name }: { name: "fork" | "shop" | "mail" }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "w-5 h-5 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "fork") {
    return (
      <svg {...common}>
        <path d="M8 3v7" />
        <path d="M12 3v7" />
        <path d="M16 3v7" />
        <path d="M8 10c0 2.4 1.8 4 4 4s4-1.6 4-4" />
        <path d="M12 14v7" />
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

export function SiteHeader({ search }: { search?: ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-6 md:pt-12 flex flex-col items-center">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="The Good Sort"
            className="w-24 md:w-32 h-auto"
          />
        </Link>
      </div>

      <nav
        className="mt-4 px-4 flex flex-col items-center gap-2.5 md:hidden"
        aria-label="Main"
      >
        {MENU_LINKS.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-semibold"
              style={{
                color: active ? "var(--brand-logo-green)" : "var(--brand-muted)",
                textDecoration: active ? "underline" : "none",
                textUnderlineOffset: "6px",
                textDecorationThickness: "2px",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <nav className="hidden md:block mt-8 max-w-3xl mx-auto px-4" aria-label="Main">
        <div
          className="flex w-full rounded-full p-1"
          style={{ background: "var(--brand-card)" }}
        >
          {MENU_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-base font-semibold whitespace-nowrap transition-colors"
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

      {search && (
        <div className="mt-5 md:mt-8 pb-6 md:pb-10 max-w-3xl mx-auto px-4">
          {search}
        </div>
      )}
    </div>
  );
}
