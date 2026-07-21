import { assert, assertFalse } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { requestSchema, dnaSchema, continuitySchema } from "./schemas.ts";
Deno.test("request validation rejects invalid UUID and unknown action", () => {
  assertFalse(
    requestSchema.safeParse({
      action: "generate_story_dna",
      projectId: "bad",
      creativeDirection: "",
    }).success,
  );
  assertFalse(
    requestSchema.safeParse({ action: "unknown", projectId: crypto.randomUUID() }).success,
  );
});
Deno.test("request validation rejects oversized chapter", () =>
  assertFalse(
    requestSchema.safeParse({
      action: "analyze_continuity",
      projectId: crypto.randomUUID(),
      documentId: crypto.randomUUID(),
      content: "x".repeat(20001),
    }).success,
  ),
);
Deno.test("story DNA rejects malformed and oversized output", () => {
  assertFalse(
    dnaSchema.safeParse({
      logline: "x",
      themes: [],
      entities: [],
      events: [],
      document: { title: "x", content: "x" },
    }).success,
  );
});
Deno.test("continuity validates severity and confidence", () => {
  assert(continuitySchema.safeParse({ summary: "ok", score: 100, issues: [] }).success);
  assertFalse(continuitySchema.safeParse({ summary: "bad", score: 101, issues: [] }).success);
});
