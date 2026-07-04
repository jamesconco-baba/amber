"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Logo, Waveform } from "./brand";
import { Card } from "./ui";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-parchment lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Link href="/">
          <Logo tagline />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-3xl text-ink">{title}</h1>
          <p className="mt-2 text-[15px] text-ink/70">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-sage">{footer}</div>
        </div>
      </div>

      {/* Right: quiet brand panel */}
      <div className="hidden items-center justify-center bg-ink p-12 lg:flex">
        <Card className="!border-parchment/10 !bg-ink-soft max-w-sm p-8 text-parchment">
          <p className="text-sm text-amber-soft">A letter from your father</p>
          <p className="mt-1 font-display text-xl italic leading-snug text-parchment/95">
            &ldquo;To be opened on your wedding day.&rdquo;
          </p>
          <div className="my-6 text-amber-soft">
            <Waveform bars={36} className="!h-9" />
          </div>
          <p className="text-xs text-parchment/60">Sealed until · Milestone: Wedding day</p>
        </Card>
      </div>
    </main>
  );
}
