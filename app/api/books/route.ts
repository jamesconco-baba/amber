import { NextResponse } from "next/server";
import { getAnthropic, MODEL, textOf } from "@/lib/ai/anthropic";

export const runtime = "nodejs";
export const maxDuration = 120;

interface Source {
  ref: string;
  title: string;
  type: string;
  text: string;
  createdAt: string;
}

interface Body {
  sources: Source[];
  creatorName?: string;
  title?: string;
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

  const { sources, creatorName = "the author", title } = body;
  if (!Array.isArray(sources) || sources.length === 0) {
    return NextResponse.json(
      { error: "Add a few memories or letters first — a memoir needs material to draw from." },
      { status: 400 }
    );
  }

  const sourceBlock = sources
    .map((s) => `[${s.ref}] ${s.type} — "${s.title}" (${new Date(s.createdAt).toLocaleDateString()})\n${s.text}`)
    .join("\n\n---\n\n");

  const system = `You are a sensitive memoir editor for Amber. You compile ${creatorName}'s preserved memories, letters, and notes into a warm, readable memoir draft.

STRICT RULES:
- Use ONLY the material in the SOURCES. Do not invent events, people, dates, opinions, or memories.
- You may organise, connect, and gently narrate — but every factual claim must trace to the SOURCES.
- Where you use a specific memory, you may reference it naturally; do not fabricate detail to fill gaps.
- Keep ${creatorName}'s voice and values at the centre. This is their story, in their spirit.
- Write in Markdown: a short evocative title, a one-paragraph preface, then chapters with '##' headings grouped by theme or life stage. Keep it to a readable draft, not exhaustive.
- If the material is sparse, produce a shorter, honest draft rather than padding.`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [
        {
          role: "user",
          content: `${title ? `Suggested title: ${title}\n\n` : ""}SOURCES:\n\n${sourceBlock}\n\nCompile the memoir draft now.`,
        },
      ],
    });
    return NextResponse.json({ markdown: textOf(msg) });
  } catch {
    return NextResponse.json({ error: "The memoir generator is unavailable right now." }, { status: 502 });
  }
}
