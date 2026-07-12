import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function countBy<T extends string>(rows: { key: T }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.key] = (out[r.key] ?? 0) + 1;
  return out;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Admin data source not configured." }, { status: 501 });

  const [contentRes, messagesRes, aiRes, familyRes] = await Promise.all([
    supabase.from("content_items").select("type"),
    supabase.from("scheduled_messages").select("trigger, status"),
    supabase.from("ai_interactions").select("guardian_status, created_at"),
    supabase.from("family_members").select("id", { count: "exact", head: true }),
  ]);

  const memoriesByType = countBy(
    (contentRes.data ?? []).map((c) => ({ key: (c.type as string) ?? "unknown" }))
  );
  const messagesByTrigger = countBy(
    (messagesRes.data ?? []).map((m) => ({ key: (m.trigger as string) ?? "unknown" }))
  );
  const messagesByStatus = countBy(
    (messagesRes.data ?? []).map((m) => ({ key: (m.status as string) ?? "unknown" }))
  );

  // ai_interactions won't exist until migration_ai.sql has been run — treat a query
  // error there as "feature not enabled yet" rather than a hard failure.
  const aiRows = aiRes.error ? [] : aiRes.data ?? [];
  const assistantByGuardianStatus = countBy(
    aiRows.map((r) => ({ key: (r.guardian_status as string) ?? "approved" }))
  );

  return NextResponse.json({
    memoriesByType,
    messagesByTrigger,
    messagesByStatus,
    assistantQueriesTotal: aiRows.length,
    assistantByGuardianStatus,
    familyTreeUsers: familyRes.count ?? 0,
    aiEnabled: !aiRes.error,
    familyTreeEnabled: !familyRes.error,
  });
}
