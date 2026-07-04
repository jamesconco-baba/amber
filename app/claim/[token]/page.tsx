"use client";

"use client";

import Link from "next/link";
import { Logo, Waveform } from "@/components/brand";
import { Button, Card } from "@/components/ui";

// The link a recipient (or their steward) opens when a release triggers. Secure token
// validation, identity verification, account linking, and content reconciliation are the
// next build sub-stage; this presents the empathetic reveal and the claim entry point.
export default function Claim({ params }: { params: { token: string } }) {
  const token = params.token;

  return (
    <main className="flex min-h-screen flex-col bg-parchment">
      <header className="mx-auto flex w-full max-w-3xl items-center px-6 py-6">
        <Logo />
      </header>

      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-clay">
          Someone kept this for you
        </p>
        <h1 className="font-display text-3xl leading-snug text-ink sm:text-4xl">
          There is something here,
          <br />
          <span className="italic text-amber">waiting for you.</span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/70">
          A loved one preserved messages and memories for you through Amber, to
          reach you when the time was right. That time has come.
        </p>

        <div className="my-8 text-amber-soft/70">
          <Waveform bars={40} className="!h-8" />
        </div>

        <Card className="w-full p-5 text-left">
          <p className="text-sm font-medium text-ink/80">To open what was left for you:</p>
          <ol className="mt-2 space-y-1.5 text-sm text-ink/70">
            <li>1. Confirm your identity (a quick, secure check).</li>
            <li>2. Create your private account, or sign in.</li>
            <li>3. Your messages are gently revealed, in the order and context they were meant for.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/signup">
              <Button>Claim what&apos;s mine</Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline">I already have an account</Button>
            </Link>
          </div>
        </Card>

        <p className="mt-6 text-xs text-sage">
          Invitation reference: <span className="font-mono">{token.slice(0, 12)}…</span>
        </p>
      </section>

      <footer className="mx-auto w-full max-w-3xl px-6 py-8 text-center text-sm text-sage">
        A place for what matters most.
      </footer>
    </main>
  );
}
