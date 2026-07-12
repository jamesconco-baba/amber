"use client";

import posthog from "posthog-js";

// Mirrors lib/supabase/client.ts's pattern: no-ops cleanly if unconfigured, so the app
// never crashes or shows broken UI just because analytics isn't set up yet.

let initialized = false;

export function isPosthogConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function initPosthog() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    // Manual pageview capture (below) so we control it on Next.js route changes —
    // PostHog's default autocapture only fires on full page loads, which App Router
    // navigation doesn't trigger.
    capture_pageview: false,
    // Automatic $pageleave events are what give us time-on-page for free.
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

export function capturePageview(url: string) {
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: url });
}

// Fire-and-forget product event, e.g. capture("memory_created", { type: "voice" }).
export function capture(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

// Tie anonymous pre-signup activity to a real account once we know who they are.
export function identify(userId: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export function resetIdentity() {
  if (!initialized) return;
  posthog.reset();
}
