"use client";

import { useState, type FormEvent } from "react";

const field =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2";
const fieldStyle = { borderColor: "#e4d7b4", color: "#231F17" };
const STRIPE_PAYMENT_URL = "https://buy.stripe.com/cNi4gsbK9axX2qUclk3wQ00";

function Label({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block text-sm font-semibold" style={{ color: "#231F17" }}>
      {children}
    </span>
  );
}

export function PostJobForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    setStatus("sending");
    try {
      const res = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value("email"),
          business: value("business"),
          role: value("role"),
          city: value("city"),
          pay: value("pay"),
          description: value("description"),
          about: value("about"),
          apply: value("apply"),
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const url = new URL(STRIPE_PAYMENT_URL);
      const email = value("email");
      if (email) url.searchParams.set("prefilled_email", email);
      window.location.assign(url.toString());
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[28px] px-5 py-6 sm:px-8 sm:py-8"
      style={{ background: "#FCFAF4" }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <Label>Restaurant or business</Label>
          <input name="business" required placeholder="Halo Bakery" className={field} style={fieldStyle} />
        </label>
        <label>
          <Label>Role</Label>
          <input name="role" required placeholder="e.g. Sous Chef" className={field} style={fieldStyle} />
        </label>
        <label>
          <Label>City</Label>
          <input name="city" required placeholder="e.g. Manchester" className={field} style={fieldStyle} />
        </label>
      </div>

      <label className="mt-4 block max-w-md">
        <Label>Your email</Label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="e.g. hello@halobakery.com"
          className={field}
          style={fieldStyle}
        />
      </label>

      <label className="mt-4 block max-w-xs">
        <Label>Pay (optional)</Label>
        <input name="pay" placeholder="e.g. £34k + tips, or £15/hr" className={field} style={fieldStyle} />
      </label>

      <label className="mt-4 block">
        <Label>Job description</Label>
        <textarea
          name="description"
          required
          rows={3}
          placeholder="The day-to-day of the role."
          className={field + " resize-y"}
          style={fieldStyle}
        />
      </label>

      <label className="mt-4 block">
        <Label>What&apos;s it actually like?</Label>
        <textarea
          name="about"
          required
          rows={3}
          placeholder="The working vibes, the team, the food. What you'd tell a friend."
          className={field + " resize-y"}
          style={fieldStyle}
        />
      </label>

      <label className="mt-4 block">
        <Label>How should chefs apply?</Label>
        <input
          name="apply"
          required
          placeholder="e.g email, link or DM"
          className={field}
          style={fieldStyle}
        />
      </label>

      <p className="mt-5 text-sm font-bold leading-snug" style={{ color: "#4E6B1F" }}>
        For just £39, no hidden costs. You&apos;ll pay by card on the next page.
      </p>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 w-full rounded-full py-3.5 text-[15px] font-bold text-white disabled:opacity-60"
        style={{ background: "#4E6B1F" }}
      >
        {status === "sending" ? "Sending…" : "Send"}
      </button>
      {status === "error" && (
        <p className="mt-3 text-center text-sm" style={{ color: "#8a3b2a" }}>
          That didn&apos;t send. Try again.
        </p>
      )}
    </form>
  );
}
