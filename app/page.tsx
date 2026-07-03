"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Logo, Waveform } from "@/components/brand";
import { Button } from "@/components/ui";

export default function Landing() {
  const { session, ready } = useStore();
  const router = useRouter();
  const signedIn = ready && !!session;

  return (
    <main className="flex min-h-screen flex-col bg-parchment">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <Button variant="ghost" size="sm" onClick={() => router.push(signedIn ? "/dashboard" : "/signin")}>
          {signedIn ? "Open my vault" : "Sign in"}
        </Button>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-clay">
          Digital legacy preservation
        </p>
        <h1 className="font-display text-4xl leading-[1.1] text-ink sm:text-6xl">
          Your voice, kept for
          <br />
          <span className="italic text-amber">the people you love.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
          Record messages, letters, and memories, and set them to arrive on the day that
          matters, this year or decades from now.
        </p>

        <div className="my-9 text-amber-soft/70">
          <Waveform bars={44} className="!h-8" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => router.push(signedIn ? "/dashboard" : "/signup")}>
            {signedIn ? "Open my vault" : "Start preserving"}
          </Button>
          {!signedIn && (
            <Button variant="outline" onClick={() => router.push("/signin")}>
              I already have an account
            </Button>
          )}
        </div>

        <p className="mt-10 text-sm text-sage">
          Preserve <span className="text-ink/60">·</span> Schedule{" "}
          <span className="text-ink/60">·</span> Pass on
        </p>
      </section>

      <footer className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-8 text-sm text-sage">
        <Logo />
        <span>A place for what matters most.</span>
      </footer>
    </main>
  );
}
