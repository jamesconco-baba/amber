"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/ui";
import { StatCard, TrendChart } from "@/components/admin/charts";
import { ConnectPosthogNotice } from "@/components/admin/connect-posthog-notice";

interface Traffic {
  configured: boolean;
  topPages?: { path: string; views: number }[];
  avgTimeOnPage?: { path: string; seconds: number }[];
  dailyViews?: { day: string; views: number }[];
  uniqueVisitors30d?: number;
}

function formatSeconds(s: number) {
  if (!s || s < 0) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function AdminTraffic() {
  const [data, setData] = useState<Traffic | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/traffic")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setData(json);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Traffic & engagement"
        subtitle="Landing page and app behavior — pageviews, time on page, and where visitors go."
      />

      {error && <Card className="mb-6 p-5 text-sm text-clay">{error}</Card>}
      {!data && !error && <div className="animate-pulse text-sm text-sage">Loading metrics…</div>}

      {data && !data.configured && <ConnectPosthogNotice />}

      {data?.configured && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Unique visitors" value={data.uniqueVisitors30d ?? 0} sublabel="Last 30 days" />
            <StatCard
              label="Pageviews"
              value={(data.dailyViews ?? []).reduce((s, d) => s + d.views, 0)}
              sublabel="Last 30 days"
            />
            <StatCard
              label="Top page avg. time"
              value={formatSeconds(data.avgTimeOnPage?.[0]?.seconds ?? 0)}
              sublabel={data.avgTimeOnPage?.[0]?.path ?? "—"}
            />
          </div>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-lg text-ink">Pageviews — last 30 days</h2>
            <Card className="p-4">
              <TrendChart
                data={(data.dailyViews ?? []).map((d) => ({ date: d.day.slice(5), count: d.views }))}
                dataKey="count"
              />
            </Card>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 font-display text-lg text-ink">Top pages</h2>
              <Card className="overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-sage">
                      <th className="px-4 py-3 font-medium">Path</th>
                      <th className="px-4 py-3 font-medium">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topPages ?? []).map((p) => (
                      <tr key={p.path} className="border-b border-ink/[0.06] last:border-0">
                        <td className="px-4 py-3 text-ink/80">{p.path}</td>
                        <td className="px-4 py-3 text-ink">{p.views}</td>
                      </tr>
                    ))}
                    {(data.topPages ?? []).length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-sage">
                          No pageviews yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg text-ink">Average time on page</h2>
              <Card className="overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-sage">
                      <th className="px-4 py-3 font-medium">Path</th>
                      <th className="px-4 py-3 font-medium">Avg. time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.avgTimeOnPage ?? []).map((p) => (
                      <tr key={p.path} className="border-b border-ink/[0.06] last:border-0">
                        <td className="px-4 py-3 text-ink/80">{p.path}</td>
                        <td className="px-4 py-3 text-ink">{formatSeconds(p.seconds)}</td>
                      </tr>
                    ))}
                    {(data.avgTimeOnPage ?? []).length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-sm text-sage">
                          Not enough data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
