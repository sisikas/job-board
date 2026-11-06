"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { openAuth } from "@/components/AuthModal";

function ForKitchensLink() {
  const pathname = usePathname();
  const current = pathname === "/for-kitchens" || pathname.startsWith("/for-kitchens/");

  return (
    <Link
      href="/for-kitchens"
      aria-current={current ? "page" : undefined}
      className="text-sm underline decoration-1 underline-offset-4"
      style={{ color: "#211c14" }}
    >
      For kitchens
    </Link>
  );
}

function AccountActions({ signedIn, className }: { signedIn: boolean; className: string }) {
  const filled = { background: "var(--brand-logo-green)", color: "#fff" };
  const outline = {
    color: "var(--brand-logo-green)",
    boxShadow: "inset 0 0 0 1.5px var(--brand-logo-green)",
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end">
      {signedIn ? (
        <form action={logout}>
          <button type="submit" className={className} style={filled}>
            Log out
          </button>
        </form>
      ) : (
        <>
          <button type="button" onClick={() => openAuth("/", "signup")} className={className} style={filled}>
            Free Sign up
          </button>
          <button type="button" onClick={() => openAuth("/", "login")} className={className} style={outline}>
            Log in
          </button>
        </>
      )}
      <span aria-hidden="true" className="h-5 w-px" style={{ background: "#c9b48a" }} />
      <ForKitchensLink />
    </div>
  );
}

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header>
      <div className="md:hidden max-w-3xl mx-auto flex flex-col items-center gap-4 px-4 pt-6 pb-2">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="The Good Sort" className="h-auto w-32" />
        </Link>
        <AccountActions
          signedIn={signedIn}
          className="rounded-full px-4 py-1.5 text-[13px] font-bold transition-opacity hover:opacity-90"
        />
      </div>

      <div className="hidden md:flex max-w-6xl mx-auto px-6 pt-10 pb-8 items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="The Good Sort" className="w-28 h-auto" />
        </Link>
        <AccountActions
          signedIn={signedIn}
          className="rounded-full px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
        />
      </div>
    </header>
  );
}
