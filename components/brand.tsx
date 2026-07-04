"use client";

export function Waveform({
  live = false,
  bars = 28,
  className = "",
}: {
  live?: boolean;
  bars?: number;
  className?: string;
}) {
  // Deterministic pseudo-random heights so SSR and client match.
  const heights = Array.from({ length: bars }, (_, i) => {
    const v = Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));
    return 20 + Math.round(v * 80); // 20%..100%
  });
  return (
    <div className={`waveform ${live ? "is-live" : ""} ${className}`} aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}%`, animationDelay: `${(i % 8) * 0.08}s` }}
        />
      ))}
    </div>
  );
}

export function Logo({ light = false, tagline = false }: { light?: boolean; tagline?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-amber text-ink">
        <Waveform bars={5} className="!h-4 !gap-[2px]" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[17px] font-medium tracking-tight ${
            light ? "text-parchment" : "text-ink"
          }`}
        >
          Amber
        </span>
        {tagline && (
          <span
            className={`mt-1 text-[11px] tracking-wide ${light ? "text-parchment/55" : "text-sage"}`}
          >
            Voice beyond time
          </span>
        )}
      </span>
    </div>
  );
}
