import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses row-level security entirely. This is what lets the
// admin dashboard aggregate data across every user instead of just the signed-in one.
//
// SECURITY: import this ONLY in Route Handlers under app/api/admin/**, and only after
// calling requireAdmin() from lib/admin-auth.ts. Never import it from a Client Component
// or anywhere the key could end up in a browser bundle — the `server-only` import above
// makes Next.js throw a build error if that ever happens by mistake.

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

export function isSupabaseAdminConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
