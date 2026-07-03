"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, EmptyState, Card } from "@/components/ui";
import { Waveform } from "@/components/brand";
import { formatDate, TYPE_GLYPH, TYPE_LABEL } from "@/lib/media";

interface Node {
  id: string;
  kind: "content" | "message";
  title: string;
  meta: string;
  date: string;
  glyph: string;
  future?: boolean;
}

export default function Timeline() {
  const { data } = useStore();

  const nodes = useMemo<Node[]>(() => {
    const contentNodes: Node[] = data.content.map((c) => ({
      id: c.id,
      kind: "content",
      title: c.title,
      meta: TYPE_LABEL[c.type],
      date: c.createdAt,
      glyph: TYPE_GLYPH[c.type],
    }));
    const messageNodes: Node[] = data.messages
      .filter((m) => m.trigger === "date" && m.releaseDate)
      .map((m) => ({
        id: m.id,
        kind: "message",
        title: m.title,
        meta: `Scheduled release · ${
          data.beneficiaries.find((b) => b.id === m.beneficiaryId)?.name ?? "circle"
        }`,
        date: m.releaseDate!,
        glyph: "✦",
        future: new Date(m.releaseDate!) > new Date(),
      }));
    return [...contentNodes, ...messageNodes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [data]);

  return (
    <div>
      <PageHeader
        eyebrow="Timeline"
        title="Your life story, as you build it"
        subtitle="A single thread of everything you've preserved and everything set to arrive in the future."
      />

      {nodes.length === 0 ? (
        <EmptyState
          title="Your timeline is empty"
          body="As you preserve memories and schedule messages, they'll appear here in order, forming a throughline of your story."
        />
      ) : (
        <div className="relative pl-8">
          {/* the thread */}
          <div className="absolute bottom-2 left-[11px] top-2 w-px bg-ink/15" />
          <ul className="space-y-5">
            {nodes.map((n) => (
              <li key={n.id} className="relative">
                <span
                  className={`absolute -left-8 top-1.5 grid h-6 w-6 place-items-center rounded-full text-xs ${
                    n.future ? "bg-amber-wash text-clay" : "bg-ink text-amber-soft"
                  }`}
                >
                  {n.glyph}
                </span>
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-sage">
                        {formatDate(n.date)}
                        {n.future && " · upcoming"}
                      </p>
                      <h3 className="mt-0.5 font-display text-lg text-ink">{n.title}</h3>
                      <p className="text-sm text-sage">{n.meta}</p>
                    </div>
                    {n.kind === "content" && n.glyph === TYPE_GLYPH.voice && (
                      <div className="hidden text-amber-soft sm:block">
                        <Waveform bars={14} className="!h-6" />
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
