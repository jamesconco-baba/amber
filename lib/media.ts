import { ContentType } from "./types";

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Could not read recording"));
    r.readAsDataURL(blob);
  });
}

export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function typeFromMime(mime: string): ContentType {
  if (mime.startsWith("audio")) return "voice";
  if (mime.startsWith("video")) return "video";
  if (mime.startsWith("image")) return "photo";
  return "document";
}

export const TYPE_LABEL: Record<ContentType, string> = {
  voice: "Voice note",
  video: "Video",
  photo: "Photo",
  document: "Document",
  letter: "Letter",
};

// Simple inline glyphs so we ship zero icon dependencies.
export const TYPE_GLYPH: Record<ContentType, string> = {
  voice: "◍",
  video: "▷",
  photo: "❑",
  document: "❧",
  letter: "✎",
};
