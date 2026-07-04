"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Button, EmptyState, Modal, Tag } from "@/components/ui";
import { formatDate, TYPE_GLYPH, TYPE_LABEL } from "@/lib/media";
import { ContentItem } from "@/lib/types";

type Mode = "theme" | "person" | "time";

interface Collection {
  title: string;
  description?: string;
  items: ContentItem[];
}

export default function Memories() {
  const { data } = useStore();
  const [mode, setMode] = useState<Mode>("person");
  const [themeCollections, setThemeCollections] = useState<Collection[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Collection | null>(null);

  const content = data.content;

  // Deterministic groupings (no AI needed)
  const byPerson = useMemo<Collection[]>(() => {
    const cols: Collection[] = [];
    for (const b of data.beneficiaries) {
      const items = content.filter((c) => c.beneficiaryIds.includes(b.id));
      if (items.length) cols.push({ title: `For ${b.name}`, description: b.relationship, items });
    }
    const shared = content.filter((c) => c.beneficiaryIds.length === 0);
    if (shared.length) cols.push({ title: "For everyone", description: "Not addressed to one person", items: shared });
    return cols;
  }, [content, data.beneficiaries]);

  const byTime = useMemo<Collection[]>(() => {
    const groups: Record<string, ContentItem[]> = {};
    for (const c of content) {
      const y = new Date(c.createdAt).getFullYear().toString();
      (groups[y] ||= []).push(c);
    }
    return Object.keys(groups)
      .sort((a, b) => Number(b) - Number(a))
      .map((y) => ({ title: y, description: `${groups[y].length} preserved`, items: groups[y] }));
  }, [content]);

  const generateThemes = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName: data.profile?.name,
          items: content
            .filter((c) => c.aiConsent !== false)
            .map((c) => ({
              id: c.id,
              title: c.title,
              type: TYPE_LABEL[c.type],
              tags: c.tags,
              date: c.createdAt,
              snippet: c.note ?? c.transcript ?? "",
            })),
        }),
      });
      const json = await res.json();
      if (res.status === 501) {
        setError("Add an ANTHROPIC_API_KEY to your environment to organise by theme.");
        return;
      }
      if (!res.ok) throw new Error(json.error || "Failed");
      const cols: Collection[] = (json.collections ?? []).map(
        (c: { title: string; description: string; itemIds: string[] }) => ({
          title: c.title,
          description: c.description,
          items: c.itemIds.map((id) => content.find((x) => x.id === id)).filter(Boolean) as ContentItem[],
        })
      );
      setThemeCollections(cols);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const active: Collection[] =
    mode === "person" ? byPerson : mode === "time" ? byTime : themeCollections ?? [];

  const TABS: { key: Mode; label: string }[] = [
    { key: "person", label: "By person" },
    { key: "time", label: "By time" },
    { key: "theme", label: "By theme (AI)" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Memories"
        title="Collections"
        subtitle="Your preserved memories, gathered into meaningful groups — by the people they're for, by when they were made, or by theme."
      />

      {content.length === 0 ? (
        <EmptyState
          title="No memories yet"
          body="Once you've preserved a few things in the Vault, they'll gather into collections here."
        />
      ) : (
        <>
          <div className="mb-6 inline-flex rounded-full border border-ink/15 bg-parchment/60 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setMode(t.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  mode === t.key ? "bg-ink text-parchment" : "text-ink/60 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {mode === "theme" && themeCollections === null && !busy && (
            <Card className="p-8 text-center">
              <p className="mx-auto max-w-md text-[15px] text-sage">
                Let the assistant gather your memories into themed collections — grounded
                only in what you&apos;ve preserved and allowed for AI.
              </p>
              <div className="mt-5 flex justify-center">
                <Button onClick={generateThemes}>Organise by theme</Button>
              </div>
            </Card>
          )}

          {mode === "theme" && busy && (
            <Card className="p-8 text-center text-sage">
              <p className="animate-pulse font-display text-lg">Gathering your memories…</p>
            </Card>
          )}

          {error && <Card className="mb-4 p-4 text-sm text-clay">{error}</Card>}

          {(mode !== "theme" || (themeCollections && !busy)) && (
            <>
              {mode === "theme" && (
                <div className="mb-4">
                  <Button variant="outline" size="sm" onClick={generateThemes} disabled={busy}>
                    Regenerate themes
                  </Button>
                </div>
              )}
              {active.length === 0 ? (
                <EmptyState title="Nothing to group here yet" body="Try another view, or add more memories." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((col, i) => (
                    <button key={i} onClick={() => setOpen(col)} className="text-left">
                      <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-lift">
                        <div className="mb-3 flex -space-x-2">
                          {col.items.slice(0, 4).map((c) => (
                            <span
                              key={c.id}
                              className="grid h-9 w-9 place-items-center rounded-full border-2 border-parchment-card bg-amber-wash text-sm text-clay"
                            >
                              {TYPE_GLYPH[c.type]}
                            </span>
                          ))}
                        </div>
                        <h3 className="font-display text-lg leading-snug text-ink">{col.title}</h3>
                        {col.description && (
                          <p className="mt-1 text-sm text-sage">{col.description}</p>
                        )}
                        <p className="mt-auto pt-3 text-xs text-clay">
                          {col.items.length} memor{col.items.length === 1 ? "y" : "ies"}
                        </p>
                      </Card>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""} wide>
        {open && (
          <div className="space-y-3">
            {open.description && <p className="text-sm text-sage">{open.description}</p>}
            <ul className="space-y-2">
              {open.items.map((c) => (
                <li key={c.id} className="rounded-xl bg-parchment/60 p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-wash text-clay">
                      {TYPE_GLYPH[c.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] text-ink">{c.title}</div>
                      <div className="text-xs text-sage">
                        {TYPE_LABEL[c.type]} · {formatDate(c.createdAt)}
                      </div>
                    </div>
                  </div>
                  {c.media
                    .filter((m) => m.kind === "voice")
                    .map((m, i) => (
                      <audio key={i} controls src={m.dataUrl} className="mt-2 w-full" />
                    ))}
                  {c.note && <p className="mt-2 text-sm text-ink/75">{c.note}</p>}
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.tags.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
