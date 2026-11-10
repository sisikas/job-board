"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

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

export function PostJobThanks() {
  return (
    <div className="rounded-[28px] px-5 py-10 sm:px-8" style={{ background: "#FCFAF4" }}>
      <Confetti />
      <h1 className="text-2xl font-bold" style={{ color: "#231F17" }}>
        Lovely! It’s in.
      </h1>
      <p className="mt-2 text-base leading-relaxed" style={{ color: "#5C5140" }}>
        We’ll process the ad and come back to you within a day.
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
