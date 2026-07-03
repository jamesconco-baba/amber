"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Recorder, RecordedAudio } from "./recorder";
import { Button, Field, Modal, inputClass } from "./ui";
import { fileToDataUrl, typeFromMime } from "@/lib/media";
import { ContentType } from "@/lib/types";

type Mode = "voice" | "letter" | "upload";

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
  const [mode, setMode] = useState<Mode>("voice");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [file, setFile] = useState<{ dataUrl: string; mime: string; name: string } | null>(null);
  const [beneficiaryIds, setBeneficiaryIds] = useState<string[]>([]);
  const [aiConsent, setAiConsent] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveTitle = title.trim() || presetPrompt?.question || "";

  const reset = () => {
    setMode("voice");
    setTitle("");
    setNote("");
    setTags("");
    setAudio(null);
    setFile(null);
    setBeneficiaryIds([]);
    setAiConsent(true);
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 25_000_000) {
      setError("Please choose a file under 25 MB.");
      return;
    }
    setError("");
    const dataUrl = await fileToDataUrl(f);
    setFile({ dataUrl, mime: f.type, name: f.name });
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const canSave =
    effectiveTitle.length > 0 &&
    ((mode === "voice" && audio) ||
      (mode === "upload" && file) ||
      (mode === "letter" && note.trim()));

  const save = async () => {
    let type: ContentType = "letter";
    let media;
    if (mode === "voice" && audio) {
      type = "voice";
      media = { dataUrl: audio.dataUrl, mimeType: audio.mimeType, durationSec: audio.durationSec };
    } else if (mode === "upload" && file) {
      type = typeFromMime(file.mime);
      media = { dataUrl: file.dataUrl, mimeType: file.mime, fileName: file.name };
    }
    setSaving(true);
    setError("");
    try {
      await addContent({
        type,
        title: effectiveTitle,
        note: note.trim() || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean).concat(presetPrompt ? [presetPrompt.category] : []),
        beneficiaryIds,
        promptId: presetPrompt?.id,
        aiConsent,
        media,
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

      {/* mode switch */}
      <div className="mb-5 inline-flex rounded-full border border-ink/15 bg-parchment/60 p-1">
        {(["voice", "letter", "upload"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              mode === m ? "bg-ink text-parchment" : "text-ink/60 hover:text-ink"
            }`}
          >
            {m === "voice" ? "Record voice" : m === "letter" ? "Write a letter" : "Upload"}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {mode === "voice" &&
          (audio ? (
            <div className="rounded-xl2 border border-ink/10 bg-parchment/50 p-4">
              <audio controls src={audio.dataUrl} className="w-full" />
              <button className="mt-2 text-sm text-clay hover:underline" onClick={() => setAudio(null)}>
                Record again
              </button>
            </div>
          ) : (
            <Recorder onCapture={setAudio} />
          ))}

        {mode === "upload" && (
          <div className="rounded-xl2 border border-dashed border-ink/20 bg-parchment/40 p-6 text-center">
            <input
              id="file"
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <label
              htmlFor="file"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[15px] font-medium text-parchment hover:bg-ink-soft"
            >
              Choose a photo, video, or document
            </label>
            {file && <p className="mt-3 text-sm text-sage">Selected: {file.name}</p>}
          </div>
        )}

        <Field label="Title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={presetPrompt ? presetPrompt.question : "Give this memory a name"}
          />
        </Field>

        <Field label={mode === "letter" ? "Your letter" : "A note or transcript (optional)"}>
          <textarea
            className={`${inputClass} min-h-[90px] resize-y`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === "letter" ? "Write in your own words…" : "Add context for whoever receives this…"}
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
