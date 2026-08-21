"use client";

import { useEffect, useState } from "react";
import type { ApplyMethod } from "@/lib/jobs";

export const APPLY_STYLE: Record<ApplyMethod, { bg: string; dot: string }> = {
  email: { bg: "var(--apply-email-bg)", dot: "var(--apply-email-dot)" },
  instagram: { bg: "var(--apply-instagram-bg)", dot: "var(--apply-instagram-dot)" },
  link: { bg: "var(--apply-link-bg)", dot: "var(--apply-link-dot)" },
};

type Apply = { href: string; label: string; method: ApplyMethod; contact: string };

export function ApplyButton({
  apply,
  venueName,
  size = "default",
}: {
  apply: Apply;
  /** business name, used to personalize the Instagram message — falls back
   *  to "the business" if not passed */
  venueName?: string;
  size?: "default" | "large";
}) {
  const [open, setOpen] = useState(false);
  const style = APPLY_STYLE[apply.method];
  const large = size === "large";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={apply.contact}
        className={
          "inline-flex items-center gap-2 rounded-full font-bold transition-opacity hover:opacity-90 " +
          (large ? "px-6 py-3.5 text-base" : "px-4 py-2 text-sm")
        }
        style={{ background: style.bg, color: "var(--brand-ink)" }}
      >
        <span
          aria-hidden="true"
          className={"rounded-full shrink-0 " + (large ? "w-2.5 h-2.5" : "w-2 h-2")}
          style={{ background: style.dot }}
        />
        {apply.label}
        <span aria-hidden="true">&rarr;</span>
      </button>

      {open && (
        <ApplyModal apply={apply} venueName={venueName} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ApplyModal({
  apply,
  venueName,
  onClose,
}: {
  apply: Apply;
  venueName?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(apply.contact);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — the address/handle is already shown on
      // screen so this isn't a dead end, just skip the "copied" feedback
    }
  }

  const business = venueName ? `${venueName}'s` : "the business's";

  const intro =
    apply.method === "email"
      ? "To apply, send an email to this address:"
      : apply.method === "instagram"
      ? `To apply, send a DM to ${business} Instagram account:`
      : "To apply, open this link:";

  const openLabel =
    apply.method === "email" ? "Open in Mail" : apply.method === "instagram" ? "Open Instagram" : "Open link";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(33, 28, 20, 0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--brand-card)", border: "1px solid var(--brand-card-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-base font-bold" style={{ color: "var(--brand-ink)" }}>
            {intro}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-xl leading-none"
            style={{ color: "var(--brand-muted)" }}
          >
            &times;
          </button>
        </div>

        <div
          className="mt-4 rounded-xl px-4 py-3 text-base font-semibold break-all"
          style={{ background: "var(--brand-cream)", color: "var(--brand-ink)" }}
        >
          {apply.method === "instagram" ? `@${apply.contact}` : apply.contact}
        </div>

        <div className="mt-4 flex gap-2">
          {apply.method !== "email" && (
            <a
              href={apply.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center rounded-full px-4 py-2.5 text-sm font-bold text-white"
              style={{ background: "var(--brand-brick)" }}
            >
              {openLabel}
            </a>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 rounded-full px-4 py-2.5 text-sm font-bold"
            style={
              apply.method === "email"
                ? { background: "var(--brand-brick)", color: "#fff" }
                : {
                    background: "var(--brand-cream)",
                    color: "var(--brand-ink)",
                    border: "1px solid var(--brand-input-border)",
                  }
            }
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
