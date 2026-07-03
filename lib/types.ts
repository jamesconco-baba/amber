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
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  relationship: string; // e.g. "Daughter", "Son", "Grandchild"
  email?: string;
  birthday?: string; // ISO date, used to suggest milestone dates
  createdAt: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  note?: string; // written body for letters / caption for media
  transcript?: string;
  tags: string[];
  beneficiaryIds: string[]; // who this is for (empty = whole circle)
  media?: {
    dataUrl: string; // base64 data URL (prototype storage)
    mimeType: string;
    fileName?: string;
    durationSec?: number;
  };
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
