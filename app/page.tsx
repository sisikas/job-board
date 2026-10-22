import { headers } from "next/headers";
import { putCountryFirst, searchJobs } from "@/lib/jobs";
import { getCurrentUser } from "@/lib/users";
import { SiteHeader } from "@/components/SiteHeader";
import { SearchForm } from "@/components/SearchForm";
import { JobBoard } from "@/components/JobBoard";
import { InstagramLink } from "@/components/InstagramLink";

export const dynamic = "force-dynamic";

// How many jobs logged-out visitors see before the sign-up blur.
const PREVIEW_COUNT = 6;
const SEARCH_PREVIEW_COUNT = 2;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const signedIn = !!user;
  const q = params.q || "";
  const location = params.location || "";

  const searching = Boolean(q || location);
  const results = await searchJobs({ q, location });
  // Vercel sets this from the visitor's IP; it's only used for ordering, never stored.
  const jobs = searching
    ? results
    : putCountryFirst(results, (await headers()).get("x-vercel-ip-country"));
  const previewCount = searching ? SEARCH_PREVIEW_COUNT : PREVIEW_COUNT;
  const visibleJobs = signedIn ? jobs : jobs.slice(0, previewCount);
  const hiddenCount = jobs.length - visibleJobs.length;

  // A search with only a result or two still gets the sign-up card, counting
  // the rest of the board instead.
  let teaserCount = signedIn ? 0 : hiddenCount;
  if (!signedIn && searching && hiddenCount === 0) {
    teaserCount = (await searchJobs({})).length - jobs.length;
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--brand-cream)" }}>
      <SiteHeader />

      <JobBoard
        jobs={visibleJobs}
        q={q}
        location={location}
        signedIn={signedIn}
        hiddenCount={signedIn ? undefined : hiddenCount}
        teaserCount={teaserCount}
        searchRow={<SearchForm q={q} location={location} />}
        searchStacked={<SearchForm q={q} location={location} stacked />}
      />

      <footer>
        <div
          className="max-w-3xl mx-auto px-4 py-6 text-xs text-center"
          style={{ color: "var(--brand-logo-green)" }}
        >
          <div className="mb-3 flex justify-center">
            <InstagramLink
              href="https://www.instagram.com/the.goodsort/"
              venueName="The Good Sort"
              color="var(--brand-logo-green)"
            />
          </div>
          Have a question about a specific role? Send a DM and mention the
          role and location.
        </div>
      </footer>
    </div>
  );
}
