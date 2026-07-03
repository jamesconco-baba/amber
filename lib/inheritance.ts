"use client";

import { getSupabase } from "./supabase/client";

export const GRACE_DAYS = 14; // life-event waiting window before irreversible release

export interface Recipient {
  id: string;
  name: string;
  relationship: string | null;
  email: string | null;
  birthday: string | null;
  age_floor: number | null;
  claimed_by: string | null;
}
export interface Contact {
  id: string;
  beneficiary_id: string;
  kind: "email" | "phone";
  value: string;
  is_primary: boolean;
}
export interface Steward {
  id: string;
  beneficiary_id: string;
  name: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
}
export interface Executor {
  id: string;
  name: string;
  relationship: string | null;
  email: string | null;
  status: string;
}
export interface VerificationEvent {
  id: string;
  beneficiary_id: string | null;
  trigger_kind: "milestone" | "life_event";
  description: string | null;
  raised_by: string | null;
  status: "pending" | "grace" | "confirmed" | "disputed" | "released" | "cancelled";
  grace_until: string | null;
  created_at: string;
}
export interface AuditEntry {
  id: string;
  action: string;
  actor: string | null;
  created_at: string;
}

export interface InheritanceData {
  recipients: Recipient[];
  contacts: Contact[];
  stewards: Steward[];
  executors: Executor[];
  events: VerificationEvent[];
  audit: AuditEntry[];
}

async function uid() {
  const s = getSupabase();
  const { data } = await s!.auth.getUser();
  return data.user!.id;
}

export async function loadInheritance(): Promise<InheritanceData> {
  const s = getSupabase();
  if (!s) return { recipients: [], contacts: [], stewards: [], executors: [], events: [], audit: [] };
  const userId = await uid();
  const [rec, con, ste, exe, ev, au] = await Promise.all([
    s.from("beneficiaries").select("*").eq("user_id", userId).order("created_at"),
    s.from("recipient_contacts").select("*").eq("user_id", userId),
    s.from("stewards").select("*").eq("user_id", userId),
    s.from("executors").select("*").eq("user_id", userId).order("created_at"),
    s.from("verification_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    s.from("release_audit").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);
  return {
    recipients: (rec.data as Recipient[]) ?? [],
    contacts: (con.data as Contact[]) ?? [],
    stewards: (ste.data as Steward[]) ?? [],
    executors: (exe.data as Executor[]) ?? [],
    events: (ev.data as VerificationEvent[]) ?? [],
    audit: (au.data as AuditEntry[]) ?? [],
  };
}

async function audit(action: string, extra: Record<string, unknown> = {}) {
  const s = getSupabase();
  const userId = await uid();
  await s!.from("release_audit").insert({ user_id: userId, action, actor: "creator", ...extra });
}

export async function setAgeFloor(beneficiaryId: string, ageFloor: number | null) {
  const s = getSupabase();
  await s!.from("beneficiaries").update({ age_floor: ageFloor }).eq("id", beneficiaryId);
}

export async function addContact(beneficiaryId: string, kind: "email" | "phone", value: string) {
  const s = getSupabase();
  const userId = await uid();
  await s!.from("recipient_contacts").insert({ user_id: userId, beneficiary_id: beneficiaryId, kind, value });
}
export async function removeContact(id: string) {
  await getSupabase()!.from("recipient_contacts").delete().eq("id", id);
}

export async function addSteward(beneficiaryId: string, s0: Omit<Steward, "id" | "beneficiary_id">) {
  const s = getSupabase();
  const userId = await uid();
  await s!.from("stewards").insert({ user_id: userId, beneficiary_id: beneficiaryId, ...s0 });
}
export async function removeSteward(id: string) {
  await getSupabase()!.from("stewards").delete().eq("id", id);
}

export async function addExecutor(e: Omit<Executor, "id" | "status">) {
  const s = getSupabase();
  const userId = await uid();
  await s!.from("executors").insert({ user_id: userId, ...e });
}
export async function removeExecutor(id: string) {
  await getSupabase()!.from("executors").delete().eq("id", id);
}

// Raise a verification event. Life events enter a grace period; milestones can be
// confirmed directly by the creator.
export async function raiseEvent(
  beneficiaryId: string | null,
  triggerKind: "milestone" | "life_event",
  description: string
) {
  const s = getSupabase();
  const userId = await uid();
  const grace =
    triggerKind === "life_event"
      ? new Date(Date.now() + GRACE_DAYS * 86400000).toISOString()
      : null;
  await s!.from("verification_events").insert({
    user_id: userId,
    beneficiary_id: beneficiaryId,
    trigger_kind: triggerKind,
    description,
    raised_by: "creator",
    status: triggerKind === "life_event" ? "grace" : "pending",
    grace_until: grace,
  });
  await audit(`Raised ${triggerKind.replace("_", " ")} verification: ${description}`);
}

export async function confirmEvent(id: string, description: string) {
  const s = getSupabase();
  await s!.from("verification_events").update({ status: "confirmed" }).eq("id", id);
  await audit(`Confirmed verification: ${description}`, { event_id: id });
}
export async function disputeEvent(id: string, description: string) {
  const s = getSupabase();
  await s!.from("verification_events").update({ status: "disputed" }).eq("id", id);
  await audit(`Disputed verification: ${description}`, { event_id: id });
}
export async function releaseEvent(id: string, description: string) {
  const s = getSupabase();
  await s!.from("verification_events").update({ status: "released" }).eq("id", id);
  await audit(`Released content for: ${description}`, { event_id: id });
}
export async function cancelEvent(id: string, description: string) {
  const s = getSupabase();
  await s!.from("verification_events").update({ status: "cancelled" }).eq("id", id);
  await audit(`Cancelled verification: ${description}`, { event_id: id });
}

// Generate a time-limited claim link for a recipient (delivery-time invitation).
export async function createClaimLink(beneficiaryId: string): Promise<string> {
  const s = getSupabase();
  const userId = await uid();
  const token = crypto.randomUUID().replace(/-/g, "");
  const expires = new Date(Date.now() + 30 * 86400000).toISOString();
  await s!.from("claim_tokens").insert({
    user_id: userId,
    beneficiary_id: beneficiaryId,
    token,
    expires_at: expires,
  });
  await audit("Generated claim invitation link");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/claim/${token}`;
}
