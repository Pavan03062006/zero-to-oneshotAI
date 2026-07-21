import { AppError } from "./errors.ts";
export interface AIResponse {
  text: string;
  raw: unknown;
  model: string;
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  latencyMs: number;
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
export async function requestAI(systemPrompt: string, userPrompt: string): Promise<AIResponse> {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new AppError("AI_PROVIDER_FAILED", "AI is not configured.", 503);
  if (Deno.env.get("ONESHOT_LOCAL_MODE") === "true" && key === "verification-placeholder") {
    throw new AppError("AI_PROVIDER_FAILED", "AI provider credentials are not configured.", 503);
  }
  const model = Deno.env.get("OPENROUTER_MODEL") ?? "google/gemini-2.5-flash";
  const timeout = Math.min(Number(Deno.env.get("AI_REQUEST_TIMEOUT_MS") ?? 30000), 60000);
  const retries = Math.min(Number(Deno.env.get("AI_MAX_RETRIES") ?? 2), 3);
  const started = Date.now();
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://zerotooneshot.lovable.app",
          "X-Title": "ONESHOT",
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          await wait(250 * 2 ** attempt);
          continue;
        }
        throw new AppError(
          "AI_PROVIDER_FAILED",
          "The AI provider could not complete the request.",
          502,
        );
      }
      const root = record(raw);
      const usage = record(root?.usage) ?? {};
      const choices = Array.isArray(root?.choices) ? root.choices : [];
      const choice = record(choices[0]);
      const message = record(choice?.message);
      const content = message?.content;
      return {
        text: typeof content === "string" ? content : "",
        raw,
        model,
        usage: {
          promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined,
          completionTokens:
            typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined,
          totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined,
        },
        latencyMs: Date.now() - started,
      };
    } catch (e) {
      if (
        attempt < retries &&
        (e instanceof TypeError || (e instanceof DOMException && e.name === "AbortError"))
      ) {
        await wait(250 * 2 ** attempt);
        continue;
      }
      if (e instanceof AppError) throw e;
      throw new AppError(
        "AI_PROVIDER_FAILED",
        e instanceof DOMException
          ? "The AI request timed out."
          : "The AI provider could not be reached.",
        504,
      );
    } finally {
      clearTimeout(timer);
    }
  }
  throw new AppError(
    "AI_PROVIDER_FAILED",
    res.status === 401 || res.status === 403
      ? "AI provider credentials are not configured."
      : "The AI provider could not complete the request.",
    res.status === 401 || res.status === 403 ? 503 : 502,
  );
}
