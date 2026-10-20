import { searchJobs } from "@/lib/jobs";
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

  const jobs = await searchJobs({ q, location });
  const previewCount = q || location ? SEARCH_PREVIEW_COUNT : PREVIEW_COUNT;
  const visibleJobs = signedIn ? jobs : jobs.slice(0, previewCount);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--brand-cream)" }}>
      <SiteHeader />

      <JobBoard
        jobs={visibleJobs}
        q={q}
        location={location}
        hiddenCount={signedIn ? undefined : jobs.length - visibleJobs.length}
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
