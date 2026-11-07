"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { openAuth } from "@/components/AuthModal";

function ForKitchensLink({ className = "text-xs underline decoration-1 underline-offset-4 md:text-sm" }: { className?: string }) {
  const pathname = usePathname();
  const current = pathname === "/for-kitchens" || pathname.startsWith("/for-kitchens/");

  return (
    <Link
      href="/for-kitchens"
      aria-current={current ? "page" : undefined}
      className={className}
      style={{ color: "#211c14" }}
    >
      For kitchens
    </Link>
  );
}

function isForKitchens(pathname: string) {
  return pathname === "/for-kitchens" || pathname.startsWith("/for-kitchens/");
}

function AccountActions({ signedIn, className }: { signedIn: boolean; className: string }) {
  const pathname = usePathname();
  const filled = { background: "var(--brand-logo-green)", color: "#fff" };
  const outline = {
    color: "var(--brand-logo-green)",
    boxShadow: "inset 0 0 0 1.5px var(--brand-logo-green)",
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-2 md:gap-x-4">
      {isForKitchens(pathname) ? (
        <Link href="/" className={className} style={filled}>
          Find a job
        </Link>
      ) : signedIn ? (
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
      {!isForKitchens(pathname) && (
        <>
          <span aria-hidden="true" className="h-3.5 w-px md:h-5" style={{ background: "#c9b48a" }} />
          <ForKitchensLink />
        </>
      )}
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      ) : (
        <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="#a89880" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MobileNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const forKitchens = isForKitchens(pathname);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const pill = "rounded-full px-4 py-2 text-sm font-bold";
  const filled = { background: "var(--brand-logo-green)", color: "#fff" };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      <div className="relative mx-auto flex h-[108px] max-w-3xl items-center justify-between px-4">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={
            open
              ? { background: "var(--brand-logo-green)", color: "#fff" }
              : { background: "#FCFAF4", color: "var(--brand-logo-green)", boxShadow: "inset 0 0 0 1.5px #e4d7b4" }
          }
          aria-expanded={open}
          aria-controls="phone-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <MenuIcon open={open} />
        </button>
        <Link href="/" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="The Good Sort" className="h-auto w-24" />
        </Link>
        {forKitchens ? (
          <Link href="/" className={pill} style={filled}>
            Find a job
          </Link>
        ) : signedIn ? (
          <form action={logout}>
            <button type="submit" className={pill} style={filled}>
              Log out
            </button>
          </form>
        ) : (
          <button
            type="button"
            className={pill}
            style={filled}
            onClick={() => {
              close();
              openAuth("/", "signup");
            }}
          >
            Sign up
          </button>
        )}
      </div>
      {open && (
        <div id="phone-menu" className="px-4 pb-4">
          <div className="rounded-[28px] px-5 pt-2 pb-4" style={{ background: "#FCFAF4" }}>
            <Link
              href="/"
              className="flex items-center justify-between py-4 text-[17px] font-semibold"
              style={{ color: "#231F17" }}
              onClick={close}
            >
              Browse jobs
              <Chevron />
            </Link>
            {!signedIn && !forKitchens && (
              <button
                type="button"
                className="flex w-full items-center justify-between py-4 text-left text-[17px] font-semibold"
                style={{ color: "#231F17" }}
                onClick={() => {
                  close();
                  openAuth("/", "signup");
                }}
              >
                Job alerts
                <Chevron />
              </button>
            )}
            {!signedIn && !forKitchens && (
              <button
                type="button"
                className="flex w-full items-center justify-between py-4 text-left text-[17px] font-semibold"
                style={{ color: "#231F17" }}
                onClick={() => {
                  close();
                  openAuth("/", "login");
                }}
              >
                Log in
                <Chevron />
              </button>
            )}
            <div className="my-2 h-px" style={{ background: "#eadfc4" }} />
            <div className="rounded-3xl px-5 pt-5 pb-4" style={{ background: "#4E6B1F" }}>
              <p className="text-sm" style={{ color: "#E8EFD9" }}>
                Hiring?
              </p>
              <Link href="/for-kitchens" className="mt-1 block text-[28px] leading-tight font-bold text-white" onClick={close}>
                For kitchens
              </Link>
              <Link
                href={forKitchens ? "/post-a-job" : "/for-kitchens"}
                className="mt-4 block rounded-full py-3 text-center text-[16px] font-bold"
                style={{ background: "#F6E8BB", color: "#2E3F12" }}
                onClick={close}
              >
                Post a job
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header>
      <MobileNav signedIn={signedIn} />

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
