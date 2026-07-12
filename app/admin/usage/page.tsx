"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/ui";
import { StatCard, BreakdownChart } from "@/components/admin/charts";

interface Usage {
  memoriesByType: Record<string, number>;
  messagesByTrigger: Record<string, number>;
  messagesByStatus: Record<string, number>;
  assistantQueriesTotal: number;
  assistantByGuardianStatus: Record<string, number>;
  familyTreeUsers: number;
  aiEnabled: boolean;
  familyTreeEnabled: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  voice: "Voice",
  video: "Video",
  photo: "Photo",
  document: "Document",
  letter: "Letter",
};

function toChartData(rec: Record<string, number>, labelMap?: Record<string, string>) {
  return Object.entries(rec).map(([key, value]) => ({
    label: labelMap?.[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));
}

export default function AdminUsage() {
  const [data, setData] = useState<Usage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/usage")
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
        title="Feature usage"
        subtitle="Which parts of Amber people actually use, so you know what to invest in next."
      />

      {error && <Card className="mb-6 p-5 text-sm text-clay">{error}</Card>}
      {!data && !error && <div className="animate-pulse text-sm text-sage">Loading metrics…</div>}

      {data && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 font-display text-lg text-ink">Memories by type</h2>
              <Card className="p-4">
                <BreakdownChart data={toChartData(data.memoriesByType, TYPE_LABEL)} dataKey="value" />
              </Card>
            </section>
            <section>
              <h2 className="mb-3 font-display text-lg text-ink">Scheduled messages by trigger</h2>
              <Card className="p-4">
                <BreakdownChart data={toChartData(data.messagesByTrigger)} dataKey="value" color="#6B7A6E" />
              </Card>
            </section>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Messages: draft" value={data.messagesByStatus.draft ?? 0} />
            <StatCard label="Messages: scheduled" value={data.messagesByStatus.scheduled ?? 0} />
            <StatCard label="Messages: delivered" value={data.messagesByStatus.delivered ?? 0} />
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg text-ink">Legacy Assistant</h2>
            {data.aiEnabled ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <StatCard label="Total assistant queries" value={data.assistantQueriesTotal} />
                <Card className="p-4">
                  <BreakdownChart
                    data={toChartData(data.assistantByGuardianStatus)}
                    dataKey="value"
                    color="#BE873B"
                    height={180}
                  />
                </Card>
              </div>
            ) : (
              <Card className="p-5 text-sm text-sage">
                Not enabled yet — run <code className="rounded bg-ink/5 px-1.5 py-0.5">supabase/migration_ai.sql</code> to
                start tracking assistant usage.
              </Card>
            )}
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg text-ink">Family Tree</h2>
            {data.familyTreeEnabled ? (
              <StatCard label="Family tree entries" value={data.familyTreeUsers} />
            ) : (
              <Card className="p-5 text-sm text-sage">
                Not enabled yet — run <code className="rounded bg-ink/5 px-1.5 py-0.5">supabase/migration_family.sql</code>{" "}
                to start tracking family tree usage.
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
