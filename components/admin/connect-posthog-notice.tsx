import { Card } from "@/components/ui";

export function ConnectPosthogNotice() {
  return (
    <Card className="p-6">
      <h3 className="font-display text-lg text-ink">Connect PostHog to see traffic data</h3>
      <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink/70">
        Landing-page pageviews, time on page, and top pages come from PostHog, which isn&apos;t
        configured yet. Create a free project at{" "}
        <a href="https://posthog.com" target="_blank" rel="noreferrer" className="text-clay hover:underline">
          posthog.com
        </a>
        , then add these to your environment (and to Vercel):
      </p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-parchment">
{`NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_PERSONAL_API_KEY=phx_...
POSTHOG_PROJECT_ID=12345`}
      </pre>
      <p className="mt-3 text-sm text-sage">
        The first two enable event capture across the app (already wired up). The last two are
        read-only keys this dashboard uses to query aggregate traffic — they&apos;re never sent to
        the browser.
      </p>
    </Card>
  );
}
