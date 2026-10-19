import { getCurrentUser } from "@/lib/users";
import { SiteNav } from "@/components/SiteNav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return <SiteNav signedIn={!!user} />;
}
