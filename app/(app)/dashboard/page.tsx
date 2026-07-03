"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PROMPTS } from "@/lib/prompts";
import { Card, PageHeader, Button, StatusPill } from "@/components/ui";
import { Waveform } from "@/components/brand";
import { AddContentModal } from "@/components/add-content-modal";
import { formatDate, TYPE_GLYPH, TYPE_LABEL } from "@/lib/media";

export default function Dashboard() {
  const { data } = useStore();
  const [open, setOpen] = useState(false);

  const prompt = useMemo(() => {
    // Rotate a prompt the creator hasn't used yet, else any.
    const used = new Set(data.content.map((c) => c.promptId).filter(Boolean));
    const fresh = PROMPTS.filter((p) => !used.has(p.id));
    const pool = fresh.length ? fresh : PROMPTS;
    return pool[new Date().getDate() % pool.length];
  }, [data.content]);

  const upcoming = useMemo(
    () =>
      data.messages
        .filter((m) => m.status === "scheduled")
        .sort((a, b) => (a.releaseDate || "").localeCompare(b.releaseDate || ""))
        .slice(0, 4),
    [data.messages]
  );

  const recent = data.content.slice(0, 4);
  const firstName = data.profile?.name.split(" ")[0];

  return (
    <div>
      <PageHeader
        eyebrow="Home"
        title={`Welcome back, ${firstName}.`}
        subtitle="Every recording, letter, and photo you add today becomes something your family can hold onto."
        action={<Button onClick={() => setOpen(true)}>Preserve a memory</Button>}
      />

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Memories preserved", value: data.content.length, href: "/vault" },
          { label: "Scheduled to release", value: data.messages.filter((m) => m.status !== "delivered").length, href: "/messenger" },
          { label: "In your circle", value: data.beneficiaries.length, href: "/circle" },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-5 transition-shadow hover:shadow-lift">
              <div className="font-display text-4xl text-ink">{s.value}</div>
              <div className="mt-1 text-sm text-sage">{s.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* guided prompt */}
      <div className="mt-6 overflow-hidden rounded-xl2 bg-ink text-parchment shadow-soft">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-soft">
              A prompt for today · {prompt.category}
            </p>
            <p className="mt-2 max-w-lg font-display text-2xl italic leading-snug">
              {prompt.question}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-amber-soft/70 sm:block">
              <Waveform bars={20} className="!h-8" />
            </div>
            <Button
              variant="outline"
              className="!border-parchment/30 !text-parchment hover:!bg-parchment/10"
              onClick={() => setOpen(true)}
            >
              Answer this
            </Button>
          </div>
        </div>
      </div>

      {/* two columns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* recent */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Recently preserved</h2>
            <Link href="/vault" className="text-sm text-clay hover:underline">
              Open vault
            </Link>
          </div>
          {recent.length ? (
            <ul className="space-y-2">
              {recent.map((c) => (
                <li key={c.id}>
                  <Card className="flex items-center gap-3 p-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-wash text-lg text-clay">
                      {TYPE_GLYPH[c.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] text-ink">{c.title}</div>
                      <div className="text-xs text-sage">
                        {TYPE_LABEL[c.type]} · {formatDate(c.createdAt)}
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <Card className="p-5 text-sm text-sage">
              Nothing here yet. Answer the prompt above to preserve your first memory.
            </Card>
          )}
        </section>

        {/* upcoming */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Upcoming releases</h2>
            <Link href="/messenger" className="text-sm text-clay hover:underline">
              Open messenger
            </Link>
          </div>
          {upcoming.length ? (
            <ul className="space-y-2">
              {upcoming.map((m) => {
                const ben = data.beneficiaries.find((b) => b.id === m.beneficiaryId);
                return (
                  <li key={m.id}>
                    <Card className="flex items-center justify-between gap-3 p-3.5">
                      <div className="min-w-0">
                        <div className="truncate text-[15px] text-ink">{m.title}</div>
                        <div className="text-xs text-sage">
                          For {ben?.name ?? "your circle"} ·{" "}
                          {m.trigger === "date" && m.releaseDate
                            ? formatDate(m.releaseDate)
                            : m.milestone}
                        </div>
                      </div>
                      <StatusPill status={m.status} />
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Card className="p-5 text-sm text-sage">
              No messages scheduled yet. In Messenger you can tie a memory to a birthday,
              graduation, or wedding.
            </Card>
          )}
        </section>
      </div>

      <AddContentModal open={open} onClose={() => setOpen(false)} presetPrompt={prompt} />
    </div>
  );
}
