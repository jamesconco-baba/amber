"use client";

import { useRef } from "react";
import { fileToDataUrl } from "@/lib/media";

function initials(name?: string) {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export function Avatar({
  url,
  name,
  size = 44,
  className = "",
}: {
  url?: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name ?? "Photo"}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      style={style}
      className={`grid shrink-0 place-items-center rounded-full bg-amber-wash font-display uppercase text-clay ${className}`}
    >
      {initials(name)}
    </span>
  );
}

// A round avatar with a "change photo" affordance. `preview` (a data URL just
// chosen) takes precedence over the saved `url`.
export function AvatarPicker({
  url,
  preview,
  name,
  size = 84,
  onPick,
  onClear,
}: {
  url?: string;
  preview?: string;
  name?: string;
  size?: number;
  onPick: (dataUrl: string) => void;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = preview || url;

  const choose = async (file?: File) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onPick(dataUrl);
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar url={shown} name={name} size={size} />
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-ink/20 px-3.5 py-1.5 text-sm text-ink hover:border-ink/40 hover:bg-ink/[0.03]"
        >
          {shown ? "Change photo" : "Add a photo"}
        </button>
        {shown && onClear && (
          <button type="button" onClick={onClear} className="text-xs text-clay hover:underline">
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => choose(e.target.files?.[0] ?? undefined)}
      />
    </div>
  );
}
