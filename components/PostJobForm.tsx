"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

const field =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2";
const fieldStyle = { borderColor: "#e4d7b4", color: "#231F17" };

const CONFETTI_COLORS = ["#4E6B1F", "#F6E8BB", "#517228", "#E8EFD9", "#c9b48a", "#231F17"];

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pieces = Array.from({ length: 140 }, () => {
      const fromBurst = Math.random() < 0.55;
      return {
        x: fromBurst ? width * (0.28 + Math.random() * 0.44) : Math.random() * width,
        y: fromBurst ? height * 0.34 : -24 - Math.random() * height * 0.45,
        w: 7 + Math.random() * 6,
        h: 5 + Math.random() * 8,
        vx: (Math.random() - 0.5) * (fromBurst ? 2.4 : 0.8),
        vy: fromBurst ? -(0.6 + Math.random() * 1.6) : 0.7 + Math.random() * 1.1,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.06,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.025 + Math.random() * 0.03,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? "#4E6B1F",
      };
    });

    const frames = 420;
    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      const fade = frame > frames * 0.72 ? 1 - (frame - frames * 0.72) / (frames * 0.28) : 1;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = Math.max(0, fade);
      for (const piece of pieces) {
        piece.wobble += piece.wobbleSpeed;
        piece.vy = Math.min(piece.vy + 0.018, 2.4);
        piece.x += piece.vx + Math.sin(piece.wobble) * 0.45;
        piece.y += piece.vy;
        piece.rot += piece.vr;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rot);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (frame < frames) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, width, height);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50" />;
}

function Label({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block text-sm font-semibold" style={{ color: "#231F17" }}>
      {children}
    </span>
  );
}

export function PostJobForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-[28px] px-5 py-10 sm:px-8" style={{ background: "#FCFAF4" }}>
        <Confetti />
        <h2 className="text-2xl font-bold" style={{ color: "#231F17" }}>
          Lovely! It&apos;s in.
        </h2>
        <p className="mt-2 text-base leading-relaxed" style={{ color: "#5C5140" }}>
          We&apos;ll process the ad and come back to you within a day.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full px-6 py-3 text-[15px] font-bold text-white"
          style={{ background: "var(--brand-brick)" }}
        >
          Home
        </Link>
      </div>
    );
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
        For just £39, no hidden costs and only once we&apos;ve approved the job.
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
