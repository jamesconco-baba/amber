// Data model — mirrors Section 21 of the concept document.
// The MVP persists to the browser; swap `lib/store.ts` for Supabase later
// without changing these shapes.

export type Role = "creator" | "beneficiary" | "executor" | "advisor";

export type ContentType = "voice" | "video" | "photo" | "document" | "letter";

export type TriggerType = "immediate" | "date" | "milestone";

export type MessageStatus = "draft" | "scheduled" | "delivered";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string; // signed URL for the profile photo
  consentAt?: string; // when they accepted the terms & privacy policy
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  relationship: string; // e.g. "Daughter", "Son", "Grandchild"
  email?: string;
  birthday?: string; // ISO date, used to suggest milestone dates
  notes?: string; // free notes / extra details about this person
  avatarUrl?: string; // signed URL for their photo
  createdAt: string;
}

export interface MediaItem {
  dataUrl: string; // signed URL (existing) or data: URL (newly added, pre-upload)
  mimeType: string;
  kind: ContentType; // voice | video | photo | document
  fileName?: string;
  durationSec?: number;
  path?: string; // storage path for already-saved files (identifies keep vs remove on edit)
}

export interface ContentItem {
  id: string;
  type: ContentType; // primary/category type, derived from the attachments + note
  title: string;
  note?: string; // written body for letters / caption for media
  transcript?: string;
  tags: string[];
  beneficiaryIds: string[]; // who this is for (empty = whole circle)
  media: MediaItem[]; // zero or more attachments of any type
  promptId?: string; // if created from a guided prompt
  aiConsent?: boolean; // include in the AI Legacy Assistant (default true)
  createdAt: string;
}

export interface ScheduledMessage {
  id: string;
  contentId?: string; // an existing vault item, optional
  title: string;
  note?: string;
  beneficiaryId: string;
  trigger: TriggerType;
  releaseDate?: string; // for "date"
  milestone?: string; // for "milestone", e.g. "Wedding day"
  status: MessageStatus;
  createdAt: string;
}

export interface GuidedPrompt {
  id: string;
  category: string;
  question: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string; // free label: "Father", "Me", "Daughter", "Grandchild"
  parentId?: string; // links to another FamilyMember (their parent in the tree)
  partnerName?: string; // spouse/partner shown alongside this node
  birthYear?: string;
  deathYear?: string;
  note?: string;
  beneficiaryId?: string; // optional link to a Legacy Circle member
  contentIds: string[]; // memories linked to this person
  createdAt: string;
}

export interface VBTData {
  profile: Profile | null;
  beneficiaries: Beneficiary[];
  content: ContentItem[];
  messages: ScheduledMessage[];
  family: FamilyMember[];
  onboarded: boolean;
}
