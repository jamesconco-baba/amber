"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/ui";
import { StatCard, TrendChart } from "@/components/admin/charts";

interface Overview {
  totals: {
    users: number;
    newUsers30d: number;
    newUsers7d: number;
    onboardedUsers: number;
    memories: number;
    messagesScheduled: number;
    beneficiaries: number;
    familyMembers: number;
  };
  signupsByDay: { date: string; count: number }[];
  memoriesByDay: { date: string; count: number }[];
}

export default function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setData(json);
      })
      .catch((e) => setError(e.message));
  }, []);

  const shortDate = (d: { date: string }) => ({ ...d, date: d.date.slice(5) });

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Growth overview"
        subtitle="Everything you need to see how Amber is growing, at a glance."
      />

      {error && (
        <Card className="mb-6 p-5 text-sm text-clay">{error}</Card>
      )}

      {!data && !error && (
        <div className="animate-pulse text-sm text-sage">Loading metrics…</div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total users" value={data.totals.users} />
            <StatCard
              label="New users"
              value={data.totals.newUsers7d}
              sublabel={`${data.totals.newUsers30d} in the last 30 days`}
            />
            <StatCard
              label="Onboarded"
              value={
                data.totals.users
                  ? `${Math.round((data.totals.onboardedUsers / data.totals.users) * 100)}%`
                  : "—"
              }
              sublabel={`${data.totals.onboardedUsers} of ${data.totals.users} completed onboarding`}
            />
            <StatCard label="Memories preserved" value={data.totals.memories} />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard label="Messages scheduled" value={data.totals.messagesScheduled} />
            <StatCard label="Legacy Circle members" value={data.totals.beneficiaries} />
            <StatCard label="Family tree entries" value={data.totals.familyMembers} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 font-display text-lg text-ink">Signups — last 30 days</h2>
              <Card className="p-4">
                <TrendChart data={data.signupsByDay.map(shortDate)} dataKey="count" />
              </Card>
            </section>
            <section>
              <h2 className="mb-3 font-display text-lg text-ink">Memories preserved — last 30 days</h2>
              <Card className="p-4">
                <TrendChart data={data.memoriesByDay.map(shortDate)} dataKey="count" color="#A9573F" />
              </Card>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
