"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Logo, Waveform } from "@/components/brand";
import { Button } from "@/components/ui";

function Badge({ status }: { status: "live" | "coming" }) {
  if (status === "live")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-medium text-sage">
        <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Live
      </span>
    );
  return (
    <span className="rounded-full border border-ink/15 px-2 py-0.5 text-[11px] font-medium text-ink/45">
      Coming soon
    </span>
  );
}

interface Feat {
  name: string;
  desc: string;
  status: "live" | "coming";
}

const GROUPS: { eyebrow: string; title: string; blurb: string; items: Feat[] }[] = [
  {
    eyebrow: "01 · Preserve",
    title: "Capture what matters, in your own voice",
    blurb: "One calm, secure home for the memories that usually scatter across phones and clouds.",
    items: [
      { name: "The Vault", desc: "Record voice notes, write letters, and keep photos, videos, and documents together.", status: "live" },
      { name: "Guided prompts", desc: "Gentle starter questions so you always know what to say.", status: "live" },
      { name: "Timeline", desc: "Everything you preserve becomes a chronological life story.", status: "live" },
      { name: "Memories", desc: "Your content gathered into collections — by person, by time, or by theme.", status: "live" },
      { name: "Automatic transcription", desc: "Spoken recordings turned into searchable text.", status: "coming" },
    ],
  },
  {
    eyebrow: "02 · Deliver across time",
    title: "Reach them at the moment that matters",
    blurb: "Tie a message to a date or a milestone — this year, or decades from now — and trust it will arrive.",
    items: [
      { name: "Milestone Messenger", desc: "Schedule messages for birthdays, graduations, weddings, and dates you choose.", status: "live" },
      { name: "Time Capsule", desc: "Content stays sealed until the moment you set.", status: "live" },
      { name: "Inheritance & Executor", desc: "Recipients, trusted stewards, life-event triggers with a safety waiting period, and an audit log.", status: "live" },
      { name: "The reveal", desc: "Beneficiaries claim and verify their vault through a secure, guided, unhurried experience.", status: "live" },
    ],
  },
  {
    eyebrow: "03 · Meet the legacy",
    title: "A living way to experience what was left",
    blurb: "Not a data dump — a guided, respectful way for family to engage over time.",
    items: [
      { name: "Legacy Assistant", desc: "Ask questions and get answers drawn only from what was preserved, pointing back to the original memory.", status: "live" },
      { name: "Books", desc: "Weave preserved letters and memories into a warm memoir draft — in your own words.", status: "live" },
      { name: "Family Tree", desc: "Map your family across generations and link each person to their memories.", status: "live" },
      { name: "Voice narration", desc: "Optional, consent-gated narration of your own written words in your own voice.", status: "coming" },
    ],
  },
];

const TRUST: Feat[] = [
  { name: "Grounded-only AI", desc: "The assistant answers strictly from what you recorded. It never invents opinions, memories, or advice.", status: "live" },
  { name: "The Guardian", desc: "A dedicated safety layer reviews every AI response for accuracy and gentleness before anyone sees it.", status: "live" },
  { name: "Consent, per memory", desc: "You decide, for each item, whether the AI may use it — and can exclude anything private.", status: "live" },
  { name: "Private by design", desc: "Media lives in private storage; access controls mean each account only ever sees its own content.", status: "live" },
  { name: "End-to-end encryption & MFA", desc: "Zero-knowledge options and multi-factor sign-in for the most sensitive legacies.", status: "coming" },
];

export default function Landing() {
  const { session, ready } = useStore();
  const router = useRouter();
  const signedIn = ready && !!session;
  const enter = () => router.push(signedIn ? "/dashboard" : "/signup");

  return (
    <main className="bg-parchment">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-ink/[0.06] bg-parchment/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <a href="#features" className="hidden rounded-full px-3 py-2 text-sm text-ink/70 hover:text-ink sm:block">
              Features
            </a>
            <a href="#trust" className="hidden rounded-full px-3 py-2 text-sm text-ink/70 hover:text-ink sm:block">
              Trust
            </a>
            <Button variant="ghost" size="sm" onClick={() => router.push(signedIn ? "/dashboard" : "/signin")}>
              {signedIn ? "Open my vault" : "Sign in"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-16 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-clay">
              <span className="h-px w-8 bg-clay/50" /> Digital legacy preservation
            </p>
            <h1 className="font-display text-4xl leading-[1.08] text-ink sm:text-6xl">
              Your voice.
              <br />
              Their future.
              <br />
              <span className="italic text-amber">A legacy that lives on.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
              The people you love will want your voice long after today&apos;s ordinary
              moment. Voice Beyond Time helps you preserve your stories, wisdom, and
              messages — and deliver them exactly when they&apos;ll matter most.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button onClick={enter}>{signedIn ? "Open my vault" : "Start preserving"}</Button>
              <a href="#how" className="rounded-full px-4 py-2.5 text-[15px] text-ink/70 hover:text-ink">
                See how it works
              </a>
            </div>
            <p className="mt-4 text-sm text-sage">Free to begin · Your content stays private to you</p>
          </div>

          <div className="relative">
            <div className="rounded-xl2 bg-ink p-8 text-parchment shadow-lift">
              <p className="text-sm text-amber-soft">A letter from your father</p>
              <p className="mt-1 font-display text-xl italic leading-snug text-parchment/95">
                &ldquo;Written on your fifth birthday, to be opened on your wedding day.&rdquo;
              </p>
              <div className="my-6 text-amber-soft">
                <Waveform bars={40} className="!h-10" />
              </div>
              <div className="flex items-center justify-between text-xs text-parchment/60">
                <span>Sealed until · Milestone: Wedding day</span>
                <span>02:14</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 -z-0 h-full w-full rounded-xl2 border border-amber/40" />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-ink/10 bg-parchment-card">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="font-display text-2xl leading-snug text-ink sm:text-3xl">
            The most important things are the ones most easily lost.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-ink/70">
            Your memories live scattered across phones, drives, and old messages. The advice
            you&apos;d give on a wedding day, a graduation, or a hard season waits for a
            moment that may never quite arrive. And what&apos;s most personal — the sound of
            your actual voice — is the first thing to fade. Voice Beyond Time exists so none
            of it has to.
          </p>
        </div>
      </section>

      {/* How it works — three steps */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { n: "Preserve", d: "Record your voice, write letters, and keep the photos and documents that carry your story." },
            { n: "Schedule", d: "Tie each message to a date or a milestone. It stays sealed until the moment arrives." },
            { n: "Pass on", d: "Build your Legacy Circle, and let those you love receive and explore your legacy over time." },
          ].map((s, i) => (
            <div key={s.n} className="rounded-xl2 border border-ink/[0.07] bg-parchment-card p-6 shadow-soft">
              <div className="font-display text-sm text-amber">0{i + 1}</div>
              <h3 className="mt-1 font-display text-2xl text-ink">{s.n}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature groups */}
      <section id="features" className="border-t border-ink/10 bg-parchment-card">
        <div className="mx-auto max-w-6xl space-y-16 px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl text-ink">Everything in one trusted place</h2>
            <p className="mt-3 text-[15px] text-ink/70">
              A complete ecosystem for preserving, delivering, and experiencing a family&apos;s
              legacy. Here&apos;s what&apos;s live today, and what&apos;s on the way — labelled
              honestly, because trust is the whole point.
            </p>
          </div>

          {GROUPS.map((g) => (
            <div key={g.title} className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-clay">{g.eyebrow}</p>
                <h3 className="mt-2 font-display text-2xl leading-snug text-ink">{g.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-sage">{g.blurb}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {g.items.map((f) => (
                  <div key={f.name} className="rounded-xl2 border border-ink/[0.07] bg-parchment p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h4 className="font-display text-[17px] text-ink">{f.name}</h4>
                      <Badge status={f.status} />
                    </div>
                    <p className="text-sm leading-relaxed text-ink/70">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-clay">Built on trust</p>
            <h2 className="mt-2 font-display text-3xl leading-snug text-ink">
              AI that honours your voice — never imitates it.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-sage">
              This is deeply personal territory, so safety isn&apos;t a feature bolted on
              afterwards — it&apos;s the foundation. The AI is only ever a guide to what you
              actually preserved.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TRUST.map((f) => (
              <div key={f.name} className="rounded-xl2 border border-ink/[0.07] bg-parchment-card p-4 shadow-soft">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h4 className="font-display text-[17px] text-ink">{f.name}</h4>
                  <Badge status={f.status} />
                </div>
                <p className="text-sm leading-relaxed text-ink/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advisors */}
      <section className="border-y border-ink/10 bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-14 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-soft">
                For estate planners & family offices
              </p>
              <Badge status="coming" />
            </div>
            <h2 className="font-display text-2xl text-parchment">
              Digital legacy as part of succession planning
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-parchment/70">
              A dedicated advisor tier for managing multiple client legacies, with compliance
              and audit tools that sit alongside traditional estate processes. In development —
              tell us if you&apos;d like to be an early partner.
            </p>
          </div>
          <Button
            variant="outline"
            className="!border-parchment/30 !text-parchment hover:!bg-parchment/10"
            onClick={enter}
          >
            Get in touch
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">
          Begin your legacy today.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-ink/70">
          Preserve one memory this week. It costs nothing to start, and it may be the most
          meaningful thing you record all year.
        </p>
        <div className="mt-8 flex justify-center">
          <Button onClick={enter}>{signedIn ? "Open my vault" : "Start preserving"}</Button>
        </div>
        <p className="mt-6 text-sm text-sage">Preserve · Schedule · Pass on</p>
      </section>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-sage sm:flex-row">
          <Logo />
          <span>A place for what matters most.</span>
        </div>
      </footer>
    </main>
  );
}
