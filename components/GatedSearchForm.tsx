"use client";

import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { openAuth } from "@/components/AuthModal";

export function GatedSearchForm({
  locked,
  className,
  children,
}: {
  locked: boolean;
  className: string;
  children: ReactNode;
}) {
  // While locked, only the Search button prompts sign-in; pressing Enter in a
  // field or picking a location suggestion (which auto-submits) does nothing.
  function onKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (locked && event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!locked) return;
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (!submitter) return;

    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }
    const query = params.toString();
    openAuth(query ? `/?${query}` : "/");
  }

  return (
    <form method="get" action="/" onKeyDown={onKeyDown} onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}
