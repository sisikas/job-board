"use client";

import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { openAuth } from "@/components/AuthModal";

function AccountButton({ signedIn, className }: { signedIn: boolean; className: string }) {
  const style = { background: "var(--brand-logo-green)", color: "#fff" };

  if (signedIn) {
    return (
      <form action={logout}>
        <button type="submit" className={className} style={style}>
          Log out
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => openAuth("/", "signup")}
        className={className}
        style={{
          color: "var(--brand-logo-green)",
          boxShadow: "inset 0 0 0 1.5px var(--brand-logo-green)",
        }}
      >
        Free Sign up
      </button>
      <button type="button" onClick={() => openAuth("/", "login")} className={className} style={style}>
        Log in
      </button>
    </div>
  );
}

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header>
      <div className="md:hidden relative max-w-3xl mx-auto px-4 pt-14 pb-2 flex flex-col items-center">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="The Good Sort" className="w-32 h-auto" />
        </Link>
        <div className="absolute right-4 top-4">
          <AccountButton
            signedIn={signedIn}
            className="rounded-full px-4 py-1.5 text-[13px] font-bold transition-opacity hover:opacity-90"
          />
        </div>
      </div>

      <div className="hidden md:flex max-w-6xl mx-auto px-6 pt-10 pb-8 items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="The Good Sort" className="w-28 h-auto" />
        </Link>
        <AccountButton
          signedIn={signedIn}
          className="rounded-full px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
        />
      </div>
    </header>
  );
}
