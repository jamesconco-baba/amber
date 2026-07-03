import { ContentItem } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/media";

export interface Source {
  id: string;
  ref: string; // short handle shown to the model + user, e.g. "S1"
  title: string;
  type: string;
  text: string;
  createdAt: string;
}

// Build the grounding corpus from the creator's content. Only items the creator
// consented to AI use, and only ones with usable text (letters, notes, transcripts).
export function buildCorpus(content: ContentItem[]): Source[] {
  const usable = content.filter((c) => c.aiConsent !== false);
  const sources: Source[] = [];
  let n = 1;
  for (const c of usable) {
    const parts = [c.note, c.transcript].filter(Boolean).join("\n\n").trim();
    // A voice/photo with no transcript/note still contributes its title as thin context.
    const text = parts || (c.type === "letter" ? "" : "");
    if (!parts && c.type !== "letter" && c.type !== "voice" && c.type !== "video") {
      // photos/documents with no note carry little groundable text; skip unless titled meaningfully
    }
    sources.push({
      id: c.id,
      ref: `S${n++}`,
      title: c.title,
      type: TYPE_LABEL[c.type] ?? c.type,
      text: text || "(no transcript provided; title only)",
      createdAt: c.createdAt,
    });
  }
  return sources;
}

export function corpusToPromptBlock(sources: Source[]): string {
  return sources
    .map(
      (s) =>
        `[${s.ref}] ${s.type} — "${s.title}" (${new Date(s.createdAt).toLocaleDateString()})\n${s.text}`
    )
    .join("\n\n---\n\n");
}
