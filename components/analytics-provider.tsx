"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPosthog, capturePageview } from "@/lib/analytics/posthog-client";

// Isolated because it reads useSearchParams — without a Suspense boundary around just
// this piece, Next.js would bail the *entire* app out of static rendering.
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    capturePageview(window.location.origin + url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}

// Sits inside the root layout, above everything. Initializes PostHog once on mount, then
// fires a $pageview on every route change — App Router navigations don't trigger a real
// page load, so PostHog's own autocapture would otherwise miss them entirely.
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const didInit = useRef(false);

  useEffect(() => {
    if (!didInit.current) {
      initPosthog();
      didInit.current = true;
    }
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  );
}
