import { NextResponse } from "next/server";
import { getAnthropic, MODEL, textOf, parseJson } from "@/lib/ai/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Item {
  id: string;
  title: string;
  type: string;
  tags: string[];
  date: string;
  snippet?: string;
}

interface Body {
  items: Item[];
  creatorName?: string;
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

  const { items, creatorName = "this person" } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ collections: [] });
  }

  const list = items
    .map(
      (i) =>
        `- id:${i.id} | ${i.type} | "${i.title}" | ${new Date(i.date).toLocaleDateString()} | tags:${(i.tags || []).join(", ")}${i.snippet ? ` | ${i.snippet.slice(0, 160)}` : ""}`
    )
    .join("\n");

  const system = `You organise ${creatorName}'s preserved memories into a handful of meaningful themed collections (e.g. "Lessons on hard work", "Our family's roots", "Everyday love", "Milestone wishes").

RULES:
- Group by theme/meaning, not just type. Use the titles, tags, and snippets provided.
- Create 3–7 collections. Every collection needs at least 2 items unless an item is clearly its own strong theme.
- Each item may appear in at most one collection. It's fine to leave weak-fit items out.
- Use ONLY the item ids provided. Do not invent items, and do not invent facts about them.
- Give each collection a short evocative title and a one-sentence description grounded in the items it contains.

Return ONLY JSON:
{"collections":[{"title":string,"description":string,"itemIds":string[]}]}`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: `ITEMS:\n${list}\n\nOrganise them now.` }],
    });
    const parsed = parseJson<{ collections: { title: string; description: string; itemIds: string[] }[] }>(
      textOf(msg)
    );
    // Keep only real ids.
    const valid = new Set(items.map((i) => i.id));
    const collections = (parsed?.collections ?? [])
      .map((c) => ({ ...c, itemIds: (c.itemIds ?? []).filter((id) => valid.has(id)) }))
      .filter((c) => c.itemIds.length > 0);
    return NextResponse.json({ collections });
  } catch {
    return NextResponse.json({ error: "The organiser is unavailable right now." }, { status: 502 });
  }
}
