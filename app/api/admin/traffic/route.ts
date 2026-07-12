import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isPosthogQueryConfigured, queryPosthog } from "@/lib/analytics/posthog-server";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  if (!isPosthogQueryConfigured()) {
    return NextResponse.json({ configured: false });
  }

  // Top pages by views, last 30 days.
  const topPagesQ = `
    select properties.$pathname as path, count() as views
    from events
    where event = '$pageview' and timestamp > now() - interval 30 day
    group by path
    order by views desc
    limit 10
  `;

  // Average time on page (seconds), derived from PostHog's $pageleave duration, last 30 days.
  const avgTimeQ = `
    select properties.$pathname as path, avg(properties.$prev_pageview_duration) as avg_seconds
    from events
    where event = '$pageleave' and timestamp > now() - interval 30 day
      and properties.$prev_pageview_duration is not null
    group by path
    order by avg_seconds desc
    limit 10
  `;

  // Pageviews per day, last 30 days — landing-page traffic trend.
  const dailyViewsQ = `
    select toDate(timestamp) as day, count() as views
    from events
    where event = '$pageview' and timestamp > now() - interval 30 day
    group by day
    order by day asc
  `;

  // Unique visitors, last 30 days.
  const uniqueVisitorsQ = `
    select count(distinct person_id) as visitors
    from events
    where event = '$pageview' and timestamp > now() - interval 30 day
  `;

  const [topPages, avgTime, dailyViews, uniqueVisitors] = await Promise.all([
    queryPosthog(topPagesQ),
    queryPosthog(avgTimeQ),
    queryPosthog(dailyViewsQ),
    queryPosthog(uniqueVisitorsQ),
  ]);

  return NextResponse.json({
    configured: true,
    topPages: topPages?.results.map(([path, views]) => ({ path, views })) ?? [],
    avgTimeOnPage: avgTime?.results.map(([path, seconds]) => ({ path, seconds })) ?? [],
    dailyViews: dailyViews?.results.map(([day, views]) => ({ day, views })) ?? [],
    uniqueVisitors30d: (uniqueVisitors?.results?.[0]?.[0] as number) ?? 0,
  });
}
