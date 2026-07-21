import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

import type { ConsistencyIssue } from "@/lib/types";

export interface GenerateStoryDnaResult {
  ok: boolean;
  model: string;
  logline: string;
  themes: string[];
  entities: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  document: { id: string; title: string; status: string };
}

export interface AnalyzeContinuityResult {
  ok: boolean;
  model: string;
  summary: string;
  score: number;
  issues: ConsistencyIssue[];
}

export class StoryEngineError extends Error {
  status: number;
  code?: string;
  friendly: string;
  constructor(message: string, opts: { status?: number; code?: string; friendly?: string } = {}) {
    super(message);
    this.status = opts.status ?? 0;
    this.code = opts.code;
    this.friendly = opts.friendly ?? message;
  }
}

async function parseFunctionsError(err: unknown): Promise<StoryEngineError> {
  if (err instanceof FunctionsHttpError) {
    const res = (err as unknown as { context?: Response }).context;
    let body: any = null;
    const status = res?.status ?? 500;
    try {
      const text = res ? await res.clone().text() : "";
      try { body = text ? JSON.parse(text) : null; } catch { body = text || null; }
    } catch { /* ignore */ }
    const msg =
      (body && typeof body === "object" && (body.error || body.message)) ||
      (typeof body === "string" ? body : "") ||
      err.message;
    let friendly = msg;
    if (status === 503) {
      friendly = "AI isn't configured yet. Ask your workspace admin to add the story-engine credentials in Cloud settings.";
    } else if (status === 401 || status === 403) {
      friendly = "Your session expired. Sign in again to continue.";
    } else if (status === 408 || status === 504) {
      friendly = "The story engine timed out. Try again in a moment.";
    } else if (status >= 500) {
      friendly = "The story engine hit an error. Try again shortly.";
    }
    return new StoryEngineError(String(msg), { status, code: body?.code, friendly });
  }
  if (err instanceof Error) {
    const isNetwork = /failed to fetch|network|load failed/i.test(err.message);
    return new StoryEngineError(err.message, {
      friendly: isNetwork
        ? "Network error reaching the story engine. Check your connection and retry."
        : err.message,
    });
  }
  return new StoryEngineError("Unknown error", { friendly: "Something went wrong. Please retry." });
}

export async function generateStoryDna(input: {
  projectId: string;
  creativeDirection?: string;
}): Promise<GenerateStoryDnaResult> {
  const { data, error } = await supabase.functions.invoke("story-engine", {
    body: {
      action: "generate_story_dna",
      projectId: input.projectId,
      creativeDirection: input.creativeDirection ?? "",
    },
  });
  if (error) throw await parseFunctionsError(error);
  return data as GenerateStoryDnaResult;
}

export async function analyzeContinuity(input: {
  projectId: string;
  documentId: string;
  content: string;
}): Promise<AnalyzeContinuityResult> {
  const { data, error } = await supabase.functions.invoke("story-engine", {
    body: {
      action: "analyze_continuity",
      projectId: input.projectId,
      documentId: input.documentId,
      content: input.content,
    },
  });
  if (error) throw await parseFunctionsError(error);
  return data as AnalyzeContinuityResult;
}

export const STATUS_COPY = {
  dna: [
    "Drafting the world's first breath…",
    "Casting characters into orbit…",
    "Threading motives through time…",
    "Anchoring locations and organizations…",
    "Binding the Story Bible…",
  ],
  continuity: [
    "Reading the scene against canon…",
    "Cross-checking characters and timelines…",
    "Weighing evidence and contradictions…",
    "Composing your continuity report…",
  ],
};
