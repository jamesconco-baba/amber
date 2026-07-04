"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Recorder } from "./recorder";
import { Button, Field, Modal, inputClass } from "./ui";
import { fileToDataUrl, typeFromMime, primaryType, formatDuration, TYPE_GLYPH } from "@/lib/media";
import { MediaItem } from "@/lib/types";

export function AddContentModal({
  open,
  onClose,
  presetPrompt,
}: {
  open: boolean;
  onClose: () => void;
  presetPrompt?: { id: string; category: string; question: string };
}) {
  const { data, addContent } = useStore();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [attachments, setAttachments] = useState<MediaItem[]>([]);
  const [recording, setRecording] = useState(false);
  const [beneficiaryIds, setBeneficiaryIds] = useState<string[]>([]);
  const [aiConsent, setAiConsent] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveTitle = title.trim() || presetPrompt?.question || "";

  const reset = () => {
    setTitle("");
    setNote("");
    setTags("");
    setAttachments([]);
    setRecording(false);
    setBeneficiaryIds([]);
    setAiConsent(true);
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const addFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError("");
    const next: MediaItem[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 25_000_000) {
        setError(`"${f.name}" is over 25 MB and was skipped.`);
        continue;
      }
      const dataUrl = await fileToDataUrl(f);
      next.push({ dataUrl, mimeType: f.type, kind: typeFromMime(f.type), fileName: f.name });
    }
    if (next.length) {
      setAttachments((a) => [...a, ...next]);
      if (!title.trim() && next[0].fileName) setTitle(next[0].fileName.replace(/\.[^.]+$/, ""));
    }
  };

  const removeAttachment = (i: number) =>
    setAttachments((a) => a.filter((_, idx) => idx !== i));

  const canSave = effectiveTitle.length > 0 && (attachments.length > 0 || note.trim().length > 0);

  const save = async () => {
    const kinds = attachments.map((m) => m.kind);
    const type = primaryType(kinds, note.trim().length > 0);
    setSaving(true);
    setError("");
    try {
      await addContent({
        type,
        title: effectiveTitle,
        note: note.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .concat(presetPrompt ? [presetPrompt.category] : []),
        beneficiaryIds,
        promptId: presetPrompt?.id,
        aiConsent,
        media: attachments,
      });
      setSaving(false);
      close();
    } catch (err) {
      setSaving(false);
      // eslint-disable-next-line no-console
      console.error(err);
      setError("Couldn't save this memory. Please check your connection and try again.");
    }
  };

  const toggleBen = (id: string) =>
    setBeneficiaryIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <Modal open={open} onClose={close} title="Preserve a memory" wide>
      {presetPrompt && (
        <div className="mb-5 rounded-xl bg-ink px-4 py-3 text-parchment">
          <span className="text-xs uppercase tracking-widest text-amber-soft">
            {presetPrompt.category}
          </span>
          <p className="mt-0.5 font-display text-lg italic">{presetPrompt.question}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Attachments */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink/80">
            Add anything — record your voice, add photos, video, or documents. You can combine
            several in one memory.
          </span>

          {attachments.length > 0 && (
            <ul className="mb-3 space-y-2">
              {attachments.map((m, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-ink/10 bg-parchment/50 p-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-wash text-clay">
                    {TYPE_GLYPH[m.kind]}
                  </span>
                  {m.kind === "photo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.dataUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-sm text-ink/80">
                    {m.fileName ?? (m.kind === "voice" ? "Voice note" : m.kind)}
                    {m.durationSec != null && (
                      <span className="text-sage"> · {formatDuration(m.durationSec)}</span>
                    )}
                  </span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="text-sm text-clay hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            {recording ? (
              <div className="w-full rounded-xl2 border border-ink/10 bg-parchment/50 p-4">
                <Recorder
                  onCapture={(a) => {
                    setAttachments((cur) => [
                      ...cur,
                      { dataUrl: a.dataUrl, mimeType: a.mimeType, kind: "voice", durationSec: a.durationSec },
                    ]);
                    setRecording(false);
                  }}
                />
                <button
                  className="mt-2 text-sm text-clay hover:underline"
                  onClick={() => setRecording(false)}
                >
                  Cancel recording
                </button>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setRecording(true)}>
                  ◍ Record voice
                </Button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/20 px-3.5 py-1.5 text-sm text-ink hover:border-ink/40 hover:bg-ink/[0.03]">
                  ＋ Add files
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        <Field label="Title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={presetPrompt ? presetPrompt.question : "Give this memory a name"}
          />
        </Field>

        <Field label="A note or letter (optional)">
          <textarea
            className={`${inputClass} min-h-[90px] resize-y`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write in your own words, or add context for whoever receives this…"
          />
        </Field>

        <Field label="Tags" hint="Comma-separated, e.g. wisdom, family history">
          <input
            className={inputClass}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="wisdom, milestones"
          />
        </Field>

        {data.beneficiaries.length > 0 && (
          <Field label="Who is this for?" hint="Leave blank to keep it for your whole circle.">
            <div className="flex flex-wrap gap-2">
              {data.beneficiaries.map((b) => (
                <button
                  key={b.id}
                  onClick={() => toggleBen(b.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    beneficiaryIds.includes(b.id)
                      ? "border-amber bg-amber-wash text-clay"
                      : "border-ink/15 text-ink/70 hover:border-ink/30"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </Field>
        )}

        {error && <p className="text-sm text-clay">{error}</p>}

        <label className="flex items-start gap-3 rounded-xl border border-ink/10 bg-parchment/50 p-3.5">
          <input
            type="checkbox"
            checked={aiConsent}
            onChange={(e) => setAiConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#BE873B]"
          />
          <span className="text-sm text-ink/75">
            <span className="font-medium text-ink">Include in the AI Legacy Assistant</span>
            <br />
            Let your family ask questions grounded in this memory. You can turn this off for
            anything private; it changes nothing about who receives the memory itself.
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave || saving}>
            {saving ? "Saving…" : "Save to vault"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
