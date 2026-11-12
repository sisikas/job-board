import type { Metadata } from "next";
import { ExcludeThisBrowser } from "@/components/ExcludeThisBrowser";
import { EXCLUDE_ANALYTICS_KEY } from "@/lib/google-analytics";

export const metadata: Metadata = {
  title: "This browser — The Good Sort",
  robots: { index: false, follow: false },
};

export default function ExcludeMePage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{localStorage.setItem(${JSON.stringify(EXCLUDE_ANALYTICS_KEY)},"1")}catch(e){}`,
        }}
      />
      <ExcludeThisBrowser />
    </>
  );
}
