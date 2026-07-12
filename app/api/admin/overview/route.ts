import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Buckets a list of ISO timestamps into a day-by-day count for the last `days` days,
// always including days with zero activity so charts don't show gaps as missing data.
function dailySeries(timestamps: string[], days: number): { date: string; count: number }[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const ts of timestamps) {
    const key = ts.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Admin data source not configured." }, { status: 501 });

  const since30 = daysAgo(30);
  const since7 = daysAgo(7);

  const [
    profilesTotal,
    profilesLast30,
    profilesLast7,
    contentTotal,
    contentLast30,
    messagesTotal,
    beneficiariesTotal,
    familyTotal,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("created_at").gte("created_at", since30),
    supabase.from("profiles").select("created_at").gte("created_at", since7),
    supabase.from("content_items").select("id", { count: "exact", head: true }),
    supabase.from("content_items").select("created_at").gte("created_at", since30),
    supabase.from("scheduled_messages").select("id", { count: "exact", head: true }),
    supabase.from("beneficiaries").select("id", { count: "exact", head: true }),
    // family_members only exists once migration_family.sql has been run — Supabase
    // reports that as `error` on the result rather than a thrown rejection, so a
    // plain query (not a throwing one) is enough; we just ignore `error` below.
    supabase.from("family_members").select("id", { count: "exact", head: true }),
  ]);

  const signupTimestamps = (profilesLast30.data ?? []).map((p) => p.created_at as string);
  const memoryTimestamps = (contentLast30.data ?? []).map((c) => c.created_at as string);

  // Onboarded rate — how many signups actually get through onboarding.
  const { count: onboardedCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("onboarded", true);

  return NextResponse.json({
    totals: {
      users: profilesTotal.count ?? 0,
      newUsers30d: profilesLast30.data?.length ?? 0,
      newUsers7d: profilesLast7.data?.length ?? 0,
      onboardedUsers: onboardedCount ?? 0,
      memories: contentTotal.count ?? 0,
      messagesScheduled: messagesTotal.count ?? 0,
      beneficiaries: beneficiariesTotal.count ?? 0,
      familyMembers: familyTotal.count ?? 0,
    },
    signupsByDay: dailySeries(signupTimestamps, 30),
    memoriesByDay: dailySeries(memoryTimestamps, 30),
  });
}
