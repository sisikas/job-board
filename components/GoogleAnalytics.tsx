"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { loadGoogleAnalytics, trackGaEvent, trackPageView } from "@/lib/google-analytics";

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    loadGoogleAnalytics();
    trackPageView(pathname);

    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const doc = document.documentElement;
      if (doc.scrollHeight <= window.innerHeight + 40) return;
      if (window.scrollY + window.innerHeight < doc.scrollHeight - 40) return;
      fired = true;
      trackGaEvent("scroll_end");
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return null;
}

export function TrackSearchForm(props: ComponentProps<"form">) {
  const { onSubmit, ...rest } = props;
  return (
    <form
      {...rest}
      onSubmit={(event) => {
        trackGaEvent("search");
        onSubmit?.(event);
      }}
    />
  );
}

export function TrackJobView() {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackGaEvent("view_job");
  }, []);
  return null;
}
