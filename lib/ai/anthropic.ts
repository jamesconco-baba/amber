import Anthropic from "@anthropic-ai/sdk";

// Current Sonnet-tier model (pinned). Good balance of quality/latency/cost for
// grounded Q&A and memoir generation.
export const MODEL = "claude-sonnet-5";

export function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

// Pull the concatenated text out of a Messages API response.
export function textOf(msg: { content: Array<{ type: string; text?: string }> }): string {
  return msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
}

// Best-effort JSON extraction from a model reply (handles ```json fences / stray prose).
export function parseJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
