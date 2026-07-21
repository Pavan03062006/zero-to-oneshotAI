import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { requestAI } from "./ai-client.ts";
import { corsFor } from "./cors.ts";
import { AppError, errorResponse } from "./errors.ts";
import { parseModelJson } from "./schemas.ts";
import { sha256 } from "./security.ts";

Deno.test("structured errors omit internal details and include request id", async () => {
  const response = errorResponse(
    new AppError("PROJECT_ACCESS_DENIED", "Denied", 403),
    "request-123",
    {},
  );
  assertEquals(response.status, 403);
  const body = await response.json();
  assertEquals(body, {
    error: { code: "PROJECT_ACCESS_DENIED", message: "Denied", requestId: "request-123" },
  });
});

Deno.test("CORS accepts configured and local origins but rejects arbitrary origins", () => {
  Deno.env.set("ALLOWED_ORIGINS", "https://app.example.com");
  assertEquals(
    corsFor(new Request("http://local", { headers: { origin: "https://app.example.com" } }))[
      "Access-Control-Allow-Origin"
    ],
    "https://app.example.com",
  );
  assertRejects(
    async () => corsFor(new Request("http://local", { headers: { origin: "https://evil.test" } })),
    AppError,
  );
});

Deno.test("model JSON parser accepts JSON fences and rejects malformed JSON", () => {
  assertEquals(parseModelJson('```json\n{"ok":true}\n```'), { ok: true });
  let failed = false;
  try {
    parseModelJson("not json");
  } catch {
    failed = true;
  }
  assertEquals(failed, true);
});

Deno.test("input hashes are deterministic and content-sensitive", async () => {
  assertEquals(await sha256("same"), await sha256("same"));
  if ((await sha256("same")) === (await sha256("changed"))) throw new Error("hash collision");
});

Deno.test("AI client retries transient 5xx and extracts usage", async () => {
  const original = globalThis.fetch;
  Deno.env.set("OPENROUTER_API_KEY", "test-key");
  Deno.env.set("AI_MAX_RETRIES", "1");
  let calls = 0;
  globalThis.fetch = (() => {
    calls += 1;
    if (calls === 1) return Promise.resolve(new Response("temporary", { status: 503 }));
    return Promise.resolve(
      Response.json({
        choices: [{ message: { content: '{"ok":true}' } }],
        usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
      }),
    );
  }) as typeof fetch;
  try {
    const result = await requestAI("system", "user");
    assertEquals(calls, 2);
    assertEquals(result.usage.totalTokens, 5);
  } finally {
    globalThis.fetch = original;
  }
});

Deno.test("AI client times out without unbounded retries", async () => {
  const original = globalThis.fetch;
  Deno.env.set("OPENROUTER_API_KEY", "test-key");
  Deno.env.set("AI_MAX_RETRIES", "0");
  Deno.env.set("AI_REQUEST_TIMEOUT_MS", "5");
  globalThis.fetch = ((_input: string | URL | Request, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("aborted", "AbortError")),
      );
    })) as typeof fetch;
  try {
    const error = await assertRejects(() => requestAI("system", "user"), AppError);
    assertStringIncludes(error.message, "timed out");
  } finally {
    globalThis.fetch = original;
  }
});
