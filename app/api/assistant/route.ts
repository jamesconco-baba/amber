import { NextResponse } from "next/server";
import { getAnthropic, MODEL, textOf, parseJson } from "@/lib/ai/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Source {
  ref: string;
  id: string;
  title: string;
  type: string;
  text: string;
  createdAt: string;
}

interface Body {
  question: string;
  sources: Source[];
  creatorName?: string;
  audience?: "creator" | "beneficiary";
}

export async function POST(req: Request) {
  const anthropic = getAnthropic();
  if (!anthropic) {
    return NextResponse.json(
      { error: "AI is not configured. Add ANTHROPIC_API_KEY to your environment." },
      { status: 501 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { question, sources, creatorName = "this person", audience = "creator" } = body;
  if (!question?.trim() || !Array.isArray(sources)) {
    return NextResponse.json({ error: "Missing question or sources." }, { status: 400 });
  }

  if (sources.length === 0) {
    return NextResponse.json({
      answer:
        "There's nothing preserved yet for me to draw on. Once memories, letters, or notes are added, I can answer questions grounded in them.",
      sourceRefs: [],
      guardian: { status: "approved", reason: "No sources; safe fallback." },
    });
  }

  const sourceBlock = sources
    .map((s) => `[${s.ref}] ${s.type} — "${s.title}" (${new Date(s.createdAt).toLocaleDateString()})\n${s.text}`)
    .join("\n\n---\n\n");

  // ---- 1) Grounded generation -------------------------------------------------
  const genSystem = `You are the Legacy Assistant for ${creatorName}. You help their family engage with the legacy ${creatorName} intentionally preserved.

STRICT RULES:
- Answer ONLY using the SOURCES below. These are things ${creatorName} actually recorded or wrote.
- NEVER invent opinions, memories, advice, or facts that are not in the SOURCES. Do not use outside/world knowledge to answer about ${creatorName}.
- If the SOURCES do not cover the question, say so plainly and warmly. Do not guess.
- Cite the sources you use with their bracket handles inline, e.g. [S1]. Only cite sources you actually used.
- Distinguish direct quotes (use quotation marks) from your own synthesis of what ${creatorName} expressed across sources.
- Speak ABOUT ${creatorName} in the third person by default (e.g. "Your father wrote that..."). You are a guide to their words, not an impersonation of them.
- Keep answers warm, concise, and grounded. This may be an emotionally significant moment for the reader.

Return ONLY a JSON object, no prose outside it:
{"answer": string, "sourceRefs": string[], "coverage": "full" | "partial" | "none"}`;

  let draft: { answer: string; sourceRefs: string[]; coverage: string } | null = null;
  try {
    const gen = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: genSystem,
      messages: [
        {
          role: "user",
          content: `SOURCES:\n\n${sourceBlock}\n\n---\n\nQUESTION (asked by a ${audience}): ${question}`,
        },
      ],
    });
    draft = parseJson(textOf(gen));
    if (!draft) draft = { answer: textOf(gen), sourceRefs: [], coverage: "partial" };
  } catch (e) {
    return NextResponse.json({ error: "The assistant is unavailable right now." }, { status: 502 });
  }

  // ---- 2) Guardian review -----------------------------------------------------
  const guardianSystem = `You are the VBT Legacy Guardian, a safety and ethics reviewer. You review a draft answer that an AI produced from ${creatorName}'s preserved content, before it reaches a family member (a ${audience}).

Check the DRAFT against these rules:
1. Grounding: every claim about ${creatorName} must be supported by the SOURCES. Flag invented opinions/memories.
2. No impersonation: it must not pose as ${creatorName} speaking live; it summarises recorded content.
3. Emotional safety: soften framing on grief, illness, death, or family conflict; be gentle and supportive.
4. Age-appropriateness and no harmful, manipulative, or exploitative content.

Decide:
- "approved": safe and grounded as-is.
- "softened": mostly fine but you improved tone/removed an ungrounded bit. Provide the improved answer.
- "blocked": unsafe or fundamentally ungrounded. Provide a brief, kind message to show instead.

Return ONLY JSON: {"status":"approved"|"softened"|"blocked","answer": string,"reason": string}
For "approved", echo the draft answer unchanged in "answer".`;

  let guardian: { status: string; answer: string; reason: string } | null = null;
  try {
    const rev = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: guardianSystem,
      messages: [
        {
          role: "user",
          content: `SOURCES:\n\n${sourceBlock}\n\n---\n\nQUESTION: ${question}\n\nDRAFT ANSWER:\n${draft.answer}`,
        },
      ],
    });
    guardian = parseJson(textOf(rev));
  } catch {
    // If the Guardian call fails, fail safe: show the grounded draft but note review was skipped.
    guardian = { status: "approved", answer: draft.answer, reason: "Review temporarily unavailable." };
  }

  const finalAnswer = guardian?.answer?.trim() || draft.answer;
  const status = guardian?.status ?? "approved";

  return NextResponse.json({
    answer: finalAnswer,
    sourceRefs: draft.sourceRefs ?? [],
    coverage: draft.coverage ?? "partial",
    guardian: { status, reason: guardian?.reason ?? "" },
  });
}
