"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";
import { buildCorpus } from "@/lib/ai/corpus";
import { capture } from "@/lib/analytics/posthog-client";
import { EVENTS } from "@/lib/analytics/events";

// Minimal, safe markdown → elements (headings, emphasis, paragraphs). No raw HTML.
function renderMarkdown(md: string) {
  const lines = md.replace(/\r/g, "").split("\n");
  const out: React.ReactNode[] = [];
  let para: string[] = [];
  const flush = (key: string) => {
    if (para.length) {
      out.push(
        <p key={key} className="mb-4 leading-relaxed text-ink/85">
          {inline(para.join(" "))}
        </p>
      );
      para = [];
    }
  };
  const inline = (s: string): React.ReactNode => {
    // bold **x** then italic *x*
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
    return parts.map((p, i) => {
      if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
      if (/^\*[^*]+\*$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>;
      return <span key={i}>{p}</span>;
    });
  };
  lines.forEach((line, i) => {
    if (/^#\s+/.test(line)) {
      flush(`p${i}`);
      out.push(
        <h1 key={i} className="mb-3 mt-2 font-display text-3xl text-ink">
          {line.replace(/^#\s+/, "")}
        </h1>
      );
    } else if (/^##\s+/.test(line)) {
      flush(`p${i}`);
      out.push(
        <h2 key={i} className="mb-2 mt-6 font-display text-xl text-ink">
          {line.replace(/^##\s+/, "")}
        </h2>
      );
    } else if (line.trim() === "") {
      flush(`p${i}`);
    } else {
      para.push(line.trim());
    }
  });
  flush("end");
  return out;
}

export default function Books() {
  const { data } = useStore();
  const corpus = useMemo(() => buildCorpus(data.content), [data.content]);
  const [busy, setBusy] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: corpus, creatorName: data.profile?.name }),
      });
      const json = await res.json();
      if (res.status === 501) {
        setError("Add an ANTHROPIC_API_KEY to your environment to generate memoirs.");
        return;
      }
      if (!res.ok) throw new Error(json.error || "Failed");
      setMarkdown(json.markdown);
      capture(EVENTS.BOOK_GENERATED);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "amber-memoir.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Books"
        title="Your memoir"
        subtitle="Weave the memories, letters, and notes you've preserved into a warm memoir draft — composed only from your own words."
        action={
          markdown ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={generate} disabled={busy}>
                {busy ? "Composing…" : "Regenerate"}
              </Button>
              <Button onClick={download}>Download .md</Button>
            </div>
          ) : (
            <Button onClick={generate} disabled={busy || corpus.length === 0}>
              {busy ? "Composing…" : "Generate memoir draft"}
            </Button>
          )
        }
      />

      {error && (
        <Card className="mb-4 p-4 text-sm text-clay">{error}</Card>
      )}

      {corpus.length === 0 ? (
        <EmptyState
          title="Nothing to compile yet"
          body="Preserve some letters and written memories first. A memoir is only ever built from what you've actually recorded."
        />
      ) : !markdown && !busy ? (
        <Card className="p-8 text-center">
          <p className="mx-auto max-w-md text-[15px] text-sage">
            Generate a draft from your {corpus.length} preserved item
            {corpus.length === 1 ? "" : "s"}. Nothing is invented — the editor organises and
            gently narrates only what you&apos;ve written and recorded.
          </p>
        </Card>
      ) : busy ? (
        <Card className="p-8 text-center text-sage">
          <p className="animate-pulse font-display text-lg">Composing your memoir…</p>
          <p className="mt-1 text-sm">This can take up to a minute for a rich archive.</p>
        </Card>
      ) : (
        <Card className="mx-auto max-w-2xl p-8 sm:p-10">
          <article>{renderMarkdown(markdown)}</article>
          <p className="mt-8 border-t border-ink/10 pt-4 text-xs italic text-sage">
            An AI-assisted draft composed from your preserved content. Review and edit freely
            — your words remain the source of truth.
          </p>
        </Card>
      )}
    </div>
  );
}
