import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const PAGE_SIZE = 25;

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Admin data source not configured." }, { status: 501 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);
  const search = (searchParams.get("q") ?? "").trim();

  // profiles doesn't store email (auth.users does) — pull both and join in memory.
  // Fine at this scale; move to a SQL view/RPC if the user base gets into the tens of
  // thousands and this needs to happen server-side.
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers({
    page: page + 1,
    perPage: PAGE_SIZE,
  });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

  let users = authUsers.users;
  if (search) {
    const q = search.toLowerCase();
    users = users.filter((u) => u.email?.toLowerCase().includes(q));
  }

  const ids = users.map((u) => u.id);
  if (ids.length === 0) {
    return NextResponse.json({ users: [], page, hasMore: false });
  }

  const [profilesRes, contentCounts, messageCounts, beneficiaryCounts] = await Promise.all([
    supabase.from("profiles").select("id, name, onboarded, is_admin, created_at").in("id", ids),
    supabase.from("content_items").select("user_id").in("user_id", ids),
    supabase.from("scheduled_messages").select("user_id").in("user_id", ids),
    supabase.from("beneficiaries").select("user_id").in("user_id", ids),
  ]);

  const countBy = (rows: { user_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1);
    return m;
  };
  const memoryCountMap = countBy(contentCounts.data as { user_id: string }[] | null);
  const messageCountMap = countBy(messageCounts.data as { user_id: string }[] | null);
  const beneficiaryCountMap = countBy(beneficiaryCounts.data as { user_id: string }[] | null);
  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

  const rows = users.map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      name: profile?.name ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      onboarded: Boolean(profile?.onboarded),
      isAdmin: Boolean(profile?.is_admin),
      memories: memoryCountMap.get(u.id) ?? 0,
      messages: messageCountMap.get(u.id) ?? 0,
      beneficiaries: beneficiaryCountMap.get(u.id) ?? 0,
    };
  });

  return NextResponse.json({
    users: rows,
    page,
    hasMore: authUsers.users.length === PAGE_SIZE,
  });
}
