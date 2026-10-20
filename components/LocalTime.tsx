"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Formats in the viewer's own timezone; the server only knows UTC. */
export function LocalTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    noopSubscribe,
    () =>
      new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    () => iso.slice(0, 10)
  );
  return <time dateTime={iso}>{text}</time>;
}
