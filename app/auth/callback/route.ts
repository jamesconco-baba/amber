import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Fallback for the code-exchange flow (default confirmation link, magic links,
// OAuth): /auth/callback?code=...&next=/onboarding
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";
  const safeNext = next.startsWith("/") ? next : "/onboarding";

  if (code) {
    const supabase = createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(safeNext, origin));
      }
    }
  }
  return NextResponse.redirect(new URL("/signin?verify=expired", origin));
}
