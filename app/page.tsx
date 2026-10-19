import { searchJobs } from "@/lib/jobs";
import { getCurrentUser } from "@/lib/users";
import { SiteHeader } from "@/components/SiteHeader";
import { SearchForm } from "@/components/SearchForm";
import { JobBoard } from "@/components/JobBoard";
import { InstagramLink } from "@/components/InstagramLink";

export const dynamic = "force-dynamic";

const PREVIEW_COUNT = 6;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const signedIn = !!user;
  const q = signedIn ? params.q || "" : "";
  const location = signedIn ? params.location || "" : "";

  const jobs = await searchJobs({ q, location });
  const visibleJobs = signedIn ? jobs : jobs.slice(0, PREVIEW_COUNT);

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--brand-cream)" }}>
      <SiteHeader />

      <JobBoard
        jobs={visibleJobs}
        q={q}
        location={location}
        hiddenCount={signedIn ? undefined : jobs.length - visibleJobs.length}
        searchRow={<SearchForm q={q} location={location} locked={!signedIn} />}
        searchStacked={<SearchForm q={q} location={location} stacked locked={!signedIn} />}
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
