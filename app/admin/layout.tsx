import { AdminNav } from "@/components/AdminNav";
import { isAuthed } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isAuthed())) return children;

  return (
    <div className="flex min-h-full flex-1">
      <AdminNav />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
