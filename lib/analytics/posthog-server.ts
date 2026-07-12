import "server-only";
import { PostHog } from "posthog-node";

let serverClient: PostHog | null = null;

export function isPosthogServerConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

// For capturing events from server code (API routes, server actions) where posthog-js
// isn't available — e.g. logging an assistant query server-side.
export function getPosthogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!serverClient) {
    serverClient = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return serverClient;
}

// Whether the *query* API (used by the Traffic page) is configured. This needs a
// personal API key + project ID — separate from the write-side project key above,
// since it grants read access to your whole PostHog project and must never reach
// the browser.
export function isPosthogQueryConfigured() {
  return Boolean(process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID);
}

// Runs a HogQL query against the PostHog Query API and returns rows + column names.
// See https://posthog.com/docs/api/queries for the HogQL query endpoint.
export async function queryPosthog(hogql: string): Promise<{ columns: string[]; results: unknown[][] } | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = process.env.POSTHOG_HOST_API || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!apiKey || !projectId) return null;

  const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql } }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = await res.json();
  return { columns: json.columns ?? [], results: json.results ?? [] };
}
