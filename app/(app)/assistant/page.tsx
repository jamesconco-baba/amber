"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Button, EmptyState, inputClass } from "@/components/ui";
import { Waveform } from "@/components/brand";
import { buildCorpus, Source } from "@/lib/ai/corpus";
import { capture } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";

interface Turn {
  role: "user" | "assistant";
  text: string;
  sources?: { ref: string; title: string; type: string }[];
  guardian?: { status: string; reason: string };
}

export default function Assistant() {
  const { data } = useStore();
  const corpus = useMemo(() => buildCorpus(data.content), [data.content]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const firstName = data.profile?.name.split(" ")[0] ?? "your family";
  const suggestions = [
    `What did ${firstName} believe about hard work?`,
    "What advice is here for hard times?",
    "Tell me about our family history.",
  ];

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setTurns((t) => [...t, { role: "user", text: question }]);
    setQ("");
    setBusy(true);
    capture(EVENTS.ASSISTANT_QUERY_SENT);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          sources: corpus,
          creatorName: data.profile?.name,
          audience: "creator",
        }),
      });
      if (res.status === 501) {
        setNotConfigured(true);
        setTurns((t) => t.slice(0, -1));
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      const used = (json.sourceRefs ?? [])
        .map((ref: string) => corpus.find((s) => s.ref === ref))
        .filter(Boolean)
        .map((s: Source) => ({ ref: s.ref, title: s.title, type: s.type }));
      setTurns((t) => [
        ...t,
        { role: "assistant", text: json.answer, sources: used, guardian: json.guardian },
      ]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "assistant", text: "Something went wrong reaching the assistant. Please try again." },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }), 50);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Legacy Assistant"
        title="Ask the legacy"
        subtitle="Answers are drawn only from what's been preserved here — never invented — and every one is reviewed by the Guardian before you see it."
      />

      {notConfigured ? (
        <Card className="p-6">
          <h3 className="font-display text-lg text-ink">Connect the AI to continue</h3>
          <p className="mt-2 text-[15px] text-ink/70">
            The assistant runs on Claude. Add an <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">ANTHROPIC_API_KEY</code>{" "}
            to your environment (and your Vercel project&apos;s variables), then reload.
          </p>
        </Card>
      ) : corpus.length === 0 ? (
        <EmptyState
          title="Nothing to draw on yet"
          body="Preserve a few letters, voice notes with a transcript, or written memories. The assistant only ever answers from what you've added — and only what you've allowed for AI."
        />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 text-xs text-sage">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-2.5 py-1 text-sage">
              <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Guardian active
            </span>
            <span>
              Grounded in {corpus.length} preserved item{corpus.length === 1 ? "" : "s"}
            </span>
          </div>

          <Card className="flex h-[60vh] flex-col overflow-hidden">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
              {turns.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="text-amber-soft">
                    <Waveform bars={28} className="!h-8" />
                  </div>
                  <p className="mt-4 max-w-sm text-[15px] text-sage">
                    Ask a question and I&apos;ll answer using only what&apos;s been preserved,
                    pointing you back to the original memory each time.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="rounded-full border border-ink/15 px-3 py-1.5 text-sm text-ink/70 hover:border-ink/30 hover:bg-ink/[0.03]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((t, i) => (
                <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] ${
                      t.role === "user"
                        ? "bg-ink text-parchment"
                        : "bg-parchment/70 text-ink"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{t.text}</p>
                    {t.role === "assistant" && t.sources && t.sources.length > 0 && (
                      <div className="mt-3 border-t border-ink/10 pt-2.5">
                        <p className="mb-1.5 text-xs font-medium text-sage">From your vault</p>
                        <div className="flex flex-wrap gap-1.5">
                          {t.sources.map((s) => (
                            <span
                              key={s.ref}
                              className="rounded-full bg-amber-wash px-2.5 py-0.5 text-xs text-clay"
                              title={s.type}
                            >
                              {s.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {t.role === "assistant" && t.guardian && t.guardian.status !== "approved" && (
                      <p className="mt-2 text-xs italic text-sage">
                        Guardian {t.guardian.status} this response for a gentler, grounded reply.
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-parchment/70 px-4 py-3 text-sage">
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-sage" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-sage [animation-delay:0.2s]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-sage [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-ink/10 p-3">
              <div className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask(q)}
                  placeholder="Ask the legacy a question…"
                  disabled={busy}
                />
                <Button onClick={() => ask(q)} disabled={busy || !q.trim()}>
                  Ask
                </Button>
              </div>
              <p className="mt-2 px-1 text-xs text-sage">
                AI-assisted summary of recorded content — not a live person, and never a
                substitute for the original recordings.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
