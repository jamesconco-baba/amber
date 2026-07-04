"use client";

import Link from "next/link";
import { Logo } from "@/components/brand";

export interface LegalSection {
  h: string;
  p: string[];
}

export function LegalDoc({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-parchment">
      <header className="border-b border-ink/[0.06]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex gap-4 text-sm text-sage">
            <Link href="/legal/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-ink">
              Privacy
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-4xl text-ink">{title}</h1>
        <p className="mt-2 text-sm text-sage">Last updated: {updated}</p>

        <div className="mt-6 rounded-xl2 border border-amber/30 bg-amber-wash/40 p-4 text-sm leading-relaxed text-ink/75">
          <strong className="text-ink">Please note:</strong> this document is a plain-language
          template provided for transparency while Amber is in development. It is not legal
          advice and may not yet be complete for your jurisdiction. Amber handles sensitive
          personal information, including voice recordings and details about family members, so
          a qualified lawyer should review and finalise these terms before you rely on them.
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-ink/80">{intro}</p>

        <div className="mt-8 space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="font-display text-xl text-ink">{s.h}</h2>
              {s.p.map((para, j) => (
                <p key={j} className="mt-2 text-[15px] leading-relaxed text-ink/80">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-ink/10 pt-6 text-sm text-sage">
          Questions? Contact us at{" "}
          <a href="mailto:privacy@theamberapp.com" className="text-clay hover:underline">
            privacy@theamberapp.com
          </a>
          .{" "}
          <Link href="/" className="text-clay hover:underline">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
