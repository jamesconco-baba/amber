// Central registry of product event names. Keeping these as constants (instead of
// inline strings scattered across the app) means the admin dashboard's Feature Usage
// page and any PostHog insight you build later are guaranteed to match what's actually
// being sent. Mirror this list in the mobile app's src/lib/analytics.js if you add events
// there too, so cross-platform funnels line up.

export const EVENTS = {
  // Landing page
  LANDING_CTA_CLICKED: "landing_cta_clicked",

  // Auth / onboarding
  SIGNUP_COMPLETED: "signup_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",

  // Vault / memories
  MEMORY_CREATED: "memory_created",
  MEMORY_UPDATED: "memory_updated",
  MEMORY_DELETED: "memory_deleted",

  // Legacy Circle
  BENEFICIARY_ADDED: "beneficiary_added",

  // Family tree
  FAMILY_MEMBER_ADDED: "family_member_added",

  // Messenger
  MESSAGE_SCHEDULED: "message_scheduled",

  // Legacy Assistant / Books (also logged server-side to ai_interactions for the
  // Feature Usage page — this client event is for funnels/session context in PostHog)
  ASSISTANT_QUERY_SENT: "assistant_query_sent",
  BOOK_GENERATED: "book_generated",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
