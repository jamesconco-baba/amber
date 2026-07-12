import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Admin data source not configured." }, { status: 501 });

  let body: { userId?: string; isAdmin?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { userId, isAdmin } = body;
  if (!userId || typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "userId and isAdmin are required." }, { status: 400 });
  }

  // Guard against an admin locking everyone out by revoking their own last-admin status.
  if (userId === admin.userId && !isAdmin) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true);
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "You're the only admin — promote someone else first." },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase.from("profiles").upsert({ id: userId, is_admin: isAdmin });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
