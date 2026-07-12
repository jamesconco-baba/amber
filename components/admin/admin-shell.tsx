"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand";

const NAV = [
  { href: "/admin", label: "Overview", glyph: "◆", exact: true },
  { href: "/admin/users", label: "Users", glyph: "◈" },
  { href: "/admin/usage", label: "Feature usage", glyph: "❋" },
  { href: "/admin/traffic", label: "Traffic", glyph: "❖" },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-parchment lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-ink/10 bg-ink px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo light />
          <p className="mt-1 px-0.5 text-xs uppercase tracking-[0.16em] text-amber-soft">Admin</p>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.href : pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                  active
                    ? "bg-parchment/10 text-parchment"
                    : "text-parchment/55 hover:bg-parchment/[0.06] hover:text-parchment/90"
                }`}
              >
                <span className={`w-4 text-center ${active ? "text-amber-soft" : ""}`}>{n.glyph}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="rounded-xl px-3 py-2 text-sm text-parchment/55 hover:bg-parchment/[0.06] hover:text-parchment/90"
          >
            ← Back to app
          </Link>
          <div className="rounded-xl bg-parchment/[0.06] px-3 py-3 text-sm text-parchment/70">
            <div className="truncate font-medium text-parchment">{email}</div>
            <div className="text-xs text-parchment/50">Admin</div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-ink/10 bg-ink px-5 py-3.5 lg:hidden">
        <div>
          <Logo light />
        </div>
        <Link href="/dashboard" className="text-sm text-parchment/70 hover:text-parchment">
          ← App
        </Link>
      </div>

      {/* Content */}
      <main className="min-w-0 pb-24 lg:pb-0">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 overflow-x-auto border-t border-ink/10 bg-parchment-card px-2 py-2 lg:hidden">
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.href : pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] ${
                active ? "text-clay" : "text-sage"
              }`}
            >
              <span className="text-base">{n.glyph}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
