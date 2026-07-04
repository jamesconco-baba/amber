import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Handles the link in the confirmation email:
//   /auth/confirm?token_hash=...&type=email&next=/onboarding
// Verifies the one-time token, sets the session cookie, and redirects.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding";
  const safeNext = next.startsWith("/") ? next : "/onboarding";

  if (token_hash && type) {
    const supabase = createServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (!error) {
        return NextResponse.redirect(new URL(safeNext, origin));
      }
    }
  }
  return NextResponse.redirect(new URL("/signin?verify=expired", origin));
}
