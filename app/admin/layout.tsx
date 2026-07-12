import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";

// Server Component: the actual access-control boundary. If this redirect didn't happen,
// a signed-out visitor or a regular user could request /admin and get the shell (though
// still no data — every /api/admin/* route re-checks independently). Belt and suspenders.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/signin?next=/admin");

  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
