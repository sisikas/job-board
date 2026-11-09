"use client";

import type { CSSProperties, ReactNode } from "react";
import { openAuth } from "@/components/AuthModal";

export function GatedJobCard({
  next,
  className,
  style,
  children,
}: {
  next: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => openAuth(next, "signup")}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
