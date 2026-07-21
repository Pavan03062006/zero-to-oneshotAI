import { z } from "npm:zod@3.24.2";
const uuid = z.string().uuid();
const short = z.string().trim().min(1).max(200);
const long = z.string().max(20000);
export const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("generate_story_dna"),
    projectId: uuid,
    creativeDirection: z.string().max(4000).default(""),
  }),
  z.object({
    action: z.literal("analyze_continuity"),
    projectId: uuid,
    documentId: uuid,
    content: long,
  }),
  z.object({
    action: z.literal("generate_development_pack"),
    projectId: uuid,
    format: z.enum(["story", "movie"]),
    direction: z.string().max(4000).default(""),
  }),
]);
const entity = z.object({
  entity_type: z.enum([
    "character",
    "location",
    "organization",
    "object",
    "world_rule",
    "theme",
    "plot_thread",
  ]),
  name: short,
  summary: z.string().max(5000),
  attributes: z.record(z.unknown()).default({}),
});
const event = z.object({
  title: short,
  description: z.string().max(5000),
  story_time: z.string().max(500).nullable().default(null),
  sequence_order: z.number().finite().min(0).max(10000),
  emotional_impact: z.string().max(1000).nullable().default(null),
});
const document = z.object({ title: short, content: z.string().min(1).max(100000) });
export const dnaSchema = z.object({
  logline: z.string().max(1000),
  themes: z.array(short).max(20),
  entities: z.array(entity).min(1).max(20),
  events: z.array(event).max(20),
  document,
});
const evidence = z.object({
  source: z.string().max(500),
  quote: z.string().max(2000),
  reason: z.string().max(2000),
});
export const continuitySchema = z.object({
  summary: z.string().max(5000),
  score: z.number().min(0).max(100),
  issues: z
    .array(
      z.object({
        issue_type: z.enum([
          "contradiction",
          "timeline",
          "character_voice",
          "world_rule",
          "unresolved_thread",
        ]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        title: short,
        explanation: z.string().max(5000),
        evidence: z.array(evidence).max(10),
        suggested_fix: z.string().max(5000),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(50),
});
export const developmentSchema = z.object({
  suggestions: z.array(z.string().max(2000)).max(12),
  character_arcs: z
    .array(
      z.object({
        name: short,
        role: z.string().max(200),
        want: z.string().max(1000),
        need: z.string().max(1000),
        flaw: z.string().max(1000),
        arc: z.string().max(5000),
      }),
    )
    .max(12),
  beats: z
    .array(
      z.object({
        title: short,
        purpose: z.string().max(3000),
        turning_point: z.string().max(3000),
      }),
    )
    .max(20),
  document,
});
export function parseModelJson(text: string) {
  const fenced = text.trim().match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] ?? text.trim();
  return JSON.parse(fenced);
}
