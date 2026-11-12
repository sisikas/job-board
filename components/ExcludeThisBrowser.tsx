"use client";

import { useEffect, useState } from "react";
import { analyticsExcluded, excludeThisBrowser } from "@/lib/google-analytics";

export function ExcludeThisBrowser() {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      excludeThisBrowser();
      setSaved(analyticsExcluded());
    } catch {
      setSaved(false);
    }
  }, []);

  return (
    <div className="flex flex-1 items-center px-6 py-20" style={{ background: "#F6E8BB", color: "#231F17" }}>
      <div className="mx-auto w-full max-w-md rounded-[28px] px-8 py-10" style={{ background: "#FCFAF4" }}>
        <h1 className="text-[32px] leading-tight font-bold tracking-[-0.02em]">
          {saved ? "This browser won’t be counted." : "This browser could not be left out."}
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed" style={{ color: "#5C5140" }}>
          {saved
            ? "Visits from this browser stay out of the numbers. Open this same page in Chrome and Safari on your computer, and in Safari on your iPhone."
            : "The browser blocked the save. Turn off private browsing and open this page again."}
        </p>
      </div>
    </div>
  );
}
