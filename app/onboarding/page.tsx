"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PROMPTS } from "@/lib/prompts";
import { Logo, Waveform } from "@/components/brand";
import { Button, Field, inputClass } from "@/components/ui";
import { Avatar, AvatarPicker } from "@/components/avatar";
import { Recorder, RecordedAudio } from "@/components/recorder";

const RELATIONSHIPS = ["Daughter", "Son", "Grandchild", "Spouse", "Sibling", "Other"];

interface CircleEntry {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  birthday?: string;
  avatar?: string;
}

export default function Onboarding() {
  const {
    ready,
    session,
    data,
    saveProfile,
    addBeneficiary,
    addContent,
    finishOnboarding,
    recordConsent,
  } = useStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // step 0 — your name + photo (account already exists via sign-up)
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>();

  // step 1 — circle
  const [bName, setBName] = useState("");
  const [bRel, setBRel] = useState(RELATIONSHIPS[0]);
  const [bEmail, setBEmail] = useState("");
  const [bBirthday, setBBirthday] = useState("");
  const [bAvatar, setBAvatar] = useState<string | undefined>();
  const [circle, setCircle] = useState<CircleEntry[]>([]);

  // step 2 — first message
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [written, setWritten] = useState("");
  const [audio, setAudio] = useState<RecordedAudio | null>(null);

  // Guard: must be signed in; skip if already onboarded.
  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/signin");
    else if (data.onboarded) router.replace("/dashboard");
  }, [ready, session, data.onboarded, router]);

  const addToCircle = () => {
    if (!bName.trim()) return;
    setCircle((c) => [
      ...c,
      {
        id: crypto.randomUUID(),
        name: bName.trim(),
        relationship: bRel,
        email: bEmail.trim() || undefined,
        birthday: bBirthday || undefined,
        avatar: bAvatar,
      },
    ]);
    setBName("");
    setBEmail("");
    setBBirthday("");
    setBAvatar(undefined);
    setBRel(RELATIONSHIPS[0]);
  };

  const finish = async () => {
    setSaving(true);
    try {
      await saveProfile(name.trim() || "You", avatar);
      await recordConsent();
      for (const b of circle) {
        await addBeneficiary(
          { name: b.name, relationship: b.relationship, email: b.email, birthday: b.birthday },
          b.avatar
        );
      }
      if (audio || written.trim()) {
        await addContent({
          type: audio ? "voice" : "letter",
          title: prompt.question,
          note: written.trim() || undefined,
          tags: [prompt.category],
          beneficiaryIds: [],
          promptId: prompt.id,
          media: audio
            ? [
                {
                  dataUrl: audio.dataUrl,
                  mimeType: audio.mimeType,
                  kind: "voice",
                  durationSec: audio.durationSec,
                },
              ]
            : [],
        });
      }
      await finishOnboarding();
      router.push("/dashboard");
    } catch (e) {
      setSaving(false);
      alert("Something went wrong saving your first entries. Please try again.");
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-parchment">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
        <Logo />
        <span className="text-sm text-sage">Step {step + 1} of 3</span>
      </header>

      {/* progress thread */}
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-amber" : "bg-ink/10"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-10">
        {step === 0 && (
          <div className="animate-fadeup">
            <h1 className="font-display text-3xl text-ink">Let&apos;s begin with you.</h1>
            <p className="mt-2 text-ink/70">
              This is your private space. Your name is how your family will recognize the
              voice behind everything you preserve.
            </p>
            <div className="mt-8 space-y-5">
              <AvatarPicker
                name={name}
                preview={avatar}
                onPick={setAvatar}
                onClear={() => setAvatar(undefined)}
              />
              <Field label="Your name">
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Adaeze Okafor"
                  autoFocus
                />
              </Field>
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!name.trim()}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fadeup">
            <h1 className="font-display text-3xl text-ink">Your Legacy Circle.</h1>
            <p className="mt-2 text-ink/70">
              These are the people you&apos;re preserving your voice for. You can add more,
              or change this, at any time.
            </p>

            <div className="mt-8 rounded-xl2 border border-ink/10 bg-parchment-card p-5">
              <AvatarPicker
                name={bName}
                preview={bAvatar}
                size={64}
                onPick={setBAvatar}
                onClear={() => setBAvatar(undefined)}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className={inputClass}
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  placeholder="Their name"
                />
                <select className={inputClass} value={bRel} onChange={(e) => setBRel(e.target.value)}>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  type="email"
                  value={bEmail}
                  onChange={(e) => setBEmail(e.target.value)}
                  placeholder="Email (optional)"
                />
                <input
                  className={inputClass}
                  type="date"
                  value={bBirthday}
                  onChange={(e) => setBBirthday(e.target.value)}
                  aria-label="Date of birth"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="outline" onClick={addToCircle} disabled={!bName.trim()}>
                  Add to circle
                </Button>
              </div>

              {circle.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-ink/10 pt-4">
                  {circle.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center gap-3 rounded-xl bg-parchment/70 px-3 py-2.5"
                    >
                      <Avatar url={b.avatar} name={b.name} size={34} />
                      <span className="flex-1 text-ink">
                        {b.name} <span className="text-sage">· {b.relationship}</span>
                        {b.email && <span className="block text-xs text-sage">{b.email}</span>}
                      </span>
                      <button
                        className="text-sm text-clay hover:underline"
                        onClick={() => setCircle((c) => c.filter((x) => x.id !== b.id))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)}>
                {circle.length ? "Continue" : "Skip for now"}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeup">
            <h1 className="font-display text-3xl text-ink">Your first message.</h1>
            <p className="mt-2 text-ink/70">
              A gentle place to start. Answer in your own words, out loud or written down.
            </p>

            <div className="mt-6 rounded-xl2 bg-ink p-6 text-parchment">
              <p className="text-xs uppercase tracking-widest text-amber-soft">
                {prompt.category}
              </p>
              <p className="mt-2 font-display text-2xl italic leading-snug">
                {prompt.question}
              </p>
              <div className="mt-4 text-amber-soft/70">
                <Waveform bars={36} className="!h-6" />
              </div>
            </div>

            <div className="mt-6">
              {audio ? (
                <div className="rounded-xl2 border border-ink/10 bg-parchment-card p-5">
                  <p className="mb-2 text-sm font-medium text-ink">Your recording</p>
                  <audio controls src={audio.dataUrl} className="w-full" />
                  <button
                    className="mt-3 text-sm text-clay hover:underline"
                    onClick={() => setAudio(null)}
                  >
                    Record again
                  </button>
                </div>
              ) : (
                <Recorder onCapture={setAudio} />
              )}
            </div>

            <div className="mt-4">
              <Field label="Or write it down">
                <textarea
                  className={`${inputClass} min-h-[110px] resize-y`}
                  value={written}
                  onChange={(e) => setWritten(e.target.value)}
                  placeholder="Take your time…"
                />
              </Field>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={finish} disabled={saving}>
                {saving
                  ? "Saving…"
                  : audio || written.trim()
                  ? "Save & enter my vault"
                  : "Enter my vault"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
