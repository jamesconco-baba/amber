"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Button, Tag, EmptyState, Modal, inputClass } from "@/components/ui";
import { AddContentModal } from "@/components/add-content-modal";
import { formatDate, formatDuration, TYPE_GLYPH, TYPE_LABEL } from "@/lib/media";
import { ContentItem, ContentType } from "@/lib/types";

const FILTERS: { key: ContentType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "voice", label: "Voice" },
  { key: "letter", label: "Letters" },
  { key: "photo", label: "Photos" },
  { key: "video", label: "Video" },
  { key: "document", label: "Documents" },
];

export default function Vault() {
  const { data, removeContent } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const [detail, setDetail] = useState<ContentItem | null>(null);

  const items = useMemo(() => {
    return data.content.filter((c) => {
      if (filter !== "all" && c.type !== filter) return false;
      if (!q.trim()) return true;
      const hay = `${c.title} ${c.note ?? ""} ${c.tags.join(" ")}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [data.content, filter, q]);

  const benNames = (ids: string[]) =>
    ids.map((id) => data.beneficiaries.find((b) => b.id === id)?.name).filter(Boolean);

  return (
    <div>
      <PageHeader
        eyebrow="Vault"
        title="Your vault"
        subtitle="Everything you've preserved, in one secure place. Search, filter, and revisit any time."
        action={<Button onClick={() => setOpen(true)}>Preserve a memory</Button>}
      />

      {/* controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className={`${inputClass} sm:max-w-xs`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search memories…"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                filter === f.key
                  ? "bg-ink text-parchment"
                  : "border border-ink/15 text-ink/60 hover:border-ink/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={data.content.length ? "Nothing matches that" : "Your vault is waiting"}
          body={
            data.content.length
              ? "Try a different search or filter."
              : "Record a voice note, write a letter, or upload a photo to begin preserving your legacy."
          }
          action={
            !data.content.length && <Button onClick={() => setOpen(true)}>Preserve your first memory</Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <button key={c.id} onClick={() => setDetail(c)} className="text-left">
              <Card className="h-full p-4 transition-shadow hover:shadow-lift">
                {c.type === "photo" && c.media ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.media.dataUrl}
                    alt={c.title}
                    className="mb-3 h-36 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-36 items-center justify-center rounded-lg bg-amber-wash/60 text-4xl text-clay">
                    {TYPE_GLYPH[c.type]}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-sage">
                  <span>{TYPE_LABEL[c.type]}</span>
                  {c.media?.durationSec != null && <span>· {formatDuration(c.media.durationSec)}</span>}
                </div>
                <h3 className="mt-1 line-clamp-2 font-display text-lg leading-snug text-ink">
                  {c.title}
                </h3>
                <p className="mt-0.5 text-xs text-sage">{formatDate(c.createdAt)}</p>
                {c.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.tags.slice(0, 3).map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ""} wide>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-sage">
              <span className="rounded-full bg-amber-wash px-2.5 py-0.5 text-xs font-medium text-clay">
                {TYPE_LABEL[detail.type]}
              </span>
              <span>{formatDate(detail.createdAt)}</span>
            </div>

            {detail.type === "voice" && detail.media && (
              <audio controls src={detail.media.dataUrl} className="w-full" />
            )}
            {detail.type === "video" && detail.media && (
              <video controls src={detail.media.dataUrl} className="w-full rounded-xl" />
            )}
            {detail.type === "photo" && detail.media && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={detail.media.dataUrl} alt={detail.title} className="w-full rounded-xl" />
            )}
            {detail.type === "document" && detail.media && (
              <a
                href={detail.media.dataUrl}
                download={detail.media.fileName}
                className="inline-block rounded-full bg-ink px-4 py-2 text-sm text-parchment"
              >
                Download {detail.media.fileName}
              </a>
            )}

            {detail.note && (
              <p className="whitespace-pre-wrap rounded-xl bg-parchment/60 p-4 text-[15px] leading-relaxed text-ink/85">
                {detail.note}
              </p>
            )}

            {benNames(detail.beneficiaryIds).length > 0 && (
              <p className="text-sm text-sage">
                For {benNames(detail.beneficiaryIds).join(", ")}
              </p>
            )}

            {detail.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detail.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            )}

            <div className="flex justify-end border-t border-ink/10 pt-4">
              <Button
                variant="danger"
                onClick={() => {
                  removeContent(detail.id);
                  setDetail(null);
                }}
              >
                Delete from vault
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <AddContentModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
