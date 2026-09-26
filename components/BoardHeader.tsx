import { SearchForm } from "@/components/SearchForm";
import { SiteHeader } from "@/components/SiteHeader";

export async function BoardHeader({
  q = "",
  location = "",
  showSearch = false,
}: {
  q?: string;
  location?: string;
  showSearch?: boolean;
}) {
  return (
    <header>
      <SiteHeader
        search={showSearch ? <SearchForm q={q} location={location} /> : undefined}
      />
    </header>
  );
}
