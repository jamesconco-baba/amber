"use client";

import { ReactNode, useEffect } from "react";

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5 text-[15px]";
  const variants: Record<string, string> = {
    primary: "bg-ink text-parchment hover:bg-ink-soft shadow-soft",
    outline: "border border-ink/20 text-ink hover:border-ink/40 hover:bg-ink/[0.03]",
    ghost: "text-ink/70 hover:text-ink hover:bg-ink/[0.05]",
    danger: "text-clay hover:bg-clay/10",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-clay">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-xl text-[15px] text-sage">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl2 border border-ink/[0.07] bg-parchment-card shadow-soft ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-sage">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-ink/15 bg-parchment/60 px-3.5 py-2.5 text-[15px] text-ink placeholder:text-sage/70 focus:border-amber focus:bg-parchment-card outline-none transition-colors";

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-amber-wash px-2.5 py-0.5 text-xs font-medium text-clay">
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-ink/8 text-ink/60",
    scheduled: "bg-amber-wash text-clay",
    delivered: "bg-sage/20 text-sage",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        map[status] ?? "bg-ink/8 text-ink/60"
      }`}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl2 border border-dashed border-ink/15 bg-parchment/40 px-6 py-12 text-center">
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-sage">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-parchment-card p-6 shadow-lift animate-fadeup sm:rounded-2xl ${
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-ink/10 hover:text-ink"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
