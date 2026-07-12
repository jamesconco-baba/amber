import "server-only";
import { createServerSupabase } from "./supabase/server";
import { getSupabaseAdmin } from "./supabase/admin";

export interface AdminSession {
  userId: string;
  email: string;
}

// Two-step check, both server-side:
//  1. Who is the signed-in user? (via the normal session-cookie client)
//  2. Does their profile have is_admin = true? (via the service-role client, since RLS
//     would otherwise let a user read only their own row anyway — but we go through the
//     admin client here for consistency with the rest of the admin data layer.)
//
// Returns null if not signed in, not an admin, or Supabase/service-role isn't configured.
// Every /admin page and /api/admin/* route must call this and bail out on null — this is
// the actual access-control boundary, not RLS, since these routes read cross-user data.
export async function requireAdmin(): Promise<AdminSession | null> {
  const supabase = createServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return null;

  return { userId: user.id, email: user.email };
}
