"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, PageHeader, Button, Tag, EmptyState, Modal, inputClass } from "@/components/ui";
import { AddContentModal } from "@/components/add-content-modal";
import { Recorder } from "@/components/recorder";
import {
  formatDate,
  formatDuration,
  typeFromMime,
  primaryType,
  fileToDataUrl,
  TYPE_GLYPH,
  TYPE_LABEL,
} from "@/lib/media";
import { ContentItem, ContentType, MediaItem } from "@/lib/types";

const FILTERS: { key: ContentType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "voice", label: "Voice" },
  { key: "letter", label: "Letters" },
  { key: "photo", label: "Photos" },
  { key: "video", label: "Video" },
  { key: "document", label: "Documents" },
];

export default function Vault() {
  const { data, removeContent, updateContent } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eNote, setENote] = useState("");
  const [eTags, setETags] = useState("");
  const [eBen, setEBen] = useState<string[]>([]);
  const [eAi, setEAi] = useState(true);
  const [eMedia, setEMedia] = useState<MediaItem[]>([]);
  const [eRecording, setERecording] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (c: ContentItem) => {
    setETitle(c.title);
    setENote(c.note ?? "");
    setETags(c.tags.join(", "));
    setEBen(c.beneficiaryIds);
    setEAi(c.aiConsent !== false);
    setEMedia(c.media);
    setERecording(false);
    setEditing(true);
  };

  const addEditFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const next: MediaItem[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 25_000_000) continue;
      const dataUrl = await fileToDataUrl(f);
      next.push({ dataUrl, mimeType: f.type, kind: typeFromMime(f.type), fileName: f.name });
    }
    setEMedia((m) => [...m, ...next]);
  };

  const closeDetail = () => {
    setDetail(null);
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!detail) return;
    setSavingEdit(true);
    try {
      await updateContent(detail.id, {
        title: eTitle.trim() || detail.title,
        note: eNote.trim() || undefined,
        tags: eTags.split(",").map((t) => t.trim()).filter(Boolean),
        beneficiaryIds: eBen,
        aiConsent: eAi,
        media: eMedia,
        type: primaryType(eMedia.map((m) => m.kind), eNote.trim().length > 0),
      });
      closeDetail();
    } finally {
      setSavingEdit(false);
    }
  };

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
          {items.map((c) => {
            const firstPhoto = c.media.find((m) => m.kind === "photo");
            const voice = c.media.find((m) => m.kind === "voice");
            return (
            <button key={c.id} onClick={() => setDetail(c)} className="text-left">
              <Card className="h-full p-4 transition-shadow hover:shadow-lift">
                {firstPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={firstPhoto.dataUrl}
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
                  {c.media.length > 1 && <span>· {c.media.length} files</span>}
                  {voice?.durationSec != null && <span>· {formatDuration(voice.durationSec)}</span>}
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
            );
          })}
        </div>
      )}

      {/* detail */}
      <Modal open={!!detail} onClose={closeDetail} title={detail?.title ?? ""} wide>
        {detail && !editing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-sage">
              <span className="rounded-full bg-amber-wash px-2.5 py-0.5 text-xs font-medium text-clay">
                {TYPE_LABEL[detail.type]}
              </span>
              <span>{formatDate(detail.createdAt)}</span>
            </div>

            {detail.media.map((m, i) => (
              <div key={i}>
                {m.kind === "voice" && <audio controls src={m.dataUrl} className="w-full" />}
                {m.kind === "video" && <video controls src={m.dataUrl} className="w-full rounded-xl" />}
                {m.kind === "photo" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.dataUrl} alt={m.fileName ?? detail.title} className="w-full rounded-xl" />
                )}
                {m.kind === "document" && (
                  <a
                    href={m.dataUrl}
                    download={m.fileName}
                    className="inline-block rounded-full bg-ink px-4 py-2 text-sm text-parchment"
                  >
                    Download {m.fileName ?? "document"}
                  </a>
                )}
              </div>
            ))}

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

            <div className="flex items-center justify-between border-t border-ink/10 pt-4">
              <Button
                variant="danger"
                onClick={() => {
                  removeContent(detail.id);
                  closeDetail();
                }}
              >
                Delete from vault
              </Button>
              <Button variant="outline" onClick={() => startEdit(detail)}>
                Edit details
              </Button>
            </div>
          </div>
        )}

        {detail && editing && (
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Attachments</span>
              {eMedia.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {eMedia.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-ink/10 bg-parchment/50 p-2.5"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-wash text-clay">
                        {TYPE_GLYPH[m.kind]}
                      </span>
                      {m.kind === "photo" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.dataUrl} alt="" className="h-10 w-10 rounded object-cover" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-ink/80">
                        {m.fileName ?? (m.kind === "voice" ? "Voice note" : m.kind)}
                        {m.durationSec != null && (
                          <span className="text-sage"> · {formatDuration(m.durationSec)}</span>
                        )}
                      </span>
                      <button
                        onClick={() => setEMedia((cur) => cur.filter((_, idx) => idx !== i))}
                        className="text-sm text-clay hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {eRecording ? (
                <div className="rounded-xl2 border border-ink/10 bg-parchment/50 p-4">
                  <Recorder
                    onCapture={(a) => {
                      setEMedia((cur) => [
                        ...cur,
                        { dataUrl: a.dataUrl, mimeType: a.mimeType, kind: "voice", durationSec: a.durationSec },
                      ]);
                      setERecording(false);
                    }}
                  />
                  <button
                    className="mt-2 text-sm text-clay hover:underline"
                    onClick={() => setERecording(false)}
                  >
                    Cancel recording
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setERecording(true)}>
                    ◍ Record voice
                  </Button>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/20 px-3.5 py-1.5 text-sm text-ink hover:border-ink/40 hover:bg-ink/[0.03]">
                    ＋ Add files
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => addEditFiles(e.target.files)}
                    />
                  </label>
                </div>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Title</span>
              <input className={inputClass} value={eTitle} onChange={(e) => setETitle(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">
                {detail.type === "letter" ? "Letter" : "Note"}
              </span>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={eNote}
                onChange={(e) => setENote(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Tags</span>
              <input
                className={inputClass}
                value={eTags}
                onChange={(e) => setETags(e.target.value)}
                placeholder="Comma separated"
              />
            </label>

            {data.beneficiaries.length > 0 && (
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink/80">Addressed to</span>
                <div className="flex flex-wrap gap-2">
                  {data.beneficiaries.map((b) => {
                    const on = eBen.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setEBen((cur) => (on ? cur.filter((x) => x !== b.id) : [...cur, b.id]))
                        }
                        className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                          on ? "bg-ink text-parchment" : "border border-ink/15 text-ink/60 hover:border-ink/30"
                        }`}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <label className="flex items-start gap-3 rounded-xl border border-ink/10 bg-parchment/50 p-3.5">
              <input
                type="checkbox"
                checked={eAi}
                onChange={(e) => setEAi(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#BE873B]"
              />
              <span className="text-sm text-ink/75">
                <span className="font-medium text-ink">Include in the AI Legacy Assistant</span>
                <br />
                Turn off to keep this memory out of AI answers.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 border-t border-ink/10 pt-4">
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <AddContentModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
