// Story engine edge function — talks to OpenRouter and persists proposed canon.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MODEL = Deno.env.get("OPENROUTER_MODEL") ?? "google/gemini-2.5-flash";

/** Extract a JSON object/array from an LLM response that may be wrapped in
 *  ```json fences or prose. Returns parsed value or throws. */
function extractJson(raw: string): any {
  if (!raw) throw new Error("Empty model response");
  let s = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` fences
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) s = fence[1].trim();
  // Try direct parse
  try {
    return JSON.parse(s);
  } catch {
    /* fall through */
  }
  // Grab first {...} or [...] block
  const first = s.search(/[[]{/);
  const lastObj = s.lastIndexOf("}");
  const lastArr = s.lastIndexOf("]");
  const last = Math.max(lastObj, lastArr);
  if (first >= 0 && last > first) {
    const slice = s.slice(first, last + 1);
    return JSON.parse(slice);
  }
  throw new Error("Model did not return JSON");
}

async function callOpenRouter(system: string, user: string): Promise<string> {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) {
    throw new Response(
      JSON.stringify({
        error:
          "AI is not configured yet. Add OPENROUTER_API_KEY to Supabase Edge Function secrets.",
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://zerotooneshot.lovable.app",
      "X-Title": "Zero to OneShot AI",
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Response(
      JSON.stringify({ error: `OpenRouter ${res.status}: ${text.slice(0, 300)}` }),
      {
        status: res.status === 401 ? 503 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

const ENTITY_TYPES = new Set([
  "character",
  "location",
  "organization",
  "object",
  "world_rule",
  "theme",
  "plot_thread",
]);

async function generateStoryDna(
  supabase: any,
  projectId: string,
  creativeDirection: string,
  userId: string | null,
) {
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (pErr || !project) return json({ error: "Project not found" }, 404);

  const system = `You are a story development engine. Return STRICT JSON only, no markdown, no prose.
Schema:
{
  "logline": string,
  "themes": string[],
  "entities": [{ "entity_type": "character"|"location"|"organization"|"object"|"world_rule"|"theme"|"plot_thread", "name": string, "summary": string, "attributes": object }],
  "events": [{ "title": string, "description": string, "story_time": string|null, "sequence_order": number, "emotional_impact": string|null }],
  "document": { "title": string, "content": string }
}
Produce 6-10 entities across multiple types, 4-6 events, and a Story Bible document in "content" as markdown.`;

  const user = `PROJECT
Title: ${project.title}
Genre: ${project.genre ?? "unspecified"}
Premise: ${project.premise ?? ""}

CREATIVE DIRECTION
${creativeDirection || "(none — infer from premise)"}

Return JSON only.`;

  const raw = await callOpenRouter(system, user);
  const parsed = extractJson(raw);

  const entitiesIn = Array.isArray(parsed.entities) ? parsed.entities : [];
  const eventsIn = Array.isArray(parsed.events) ? parsed.events : [];

  const entityRows = entitiesIn
    .filter((e: any) => e && ENTITY_TYPES.has(e.entity_type) && typeof e.name === "string")
    .map((e: any) => ({
      project_id: projectId,
      entity_type: e.entity_type,
      name: String(e.name).slice(0, 200),
      summary: e.summary ? String(e.summary) : null,
      attributes: e.attributes && typeof e.attributes === "object" ? e.attributes : {},
      canon_status: "proposed",
      created_by: userId,
    }));

  let insertedEntities: any[] = [];
  if (entityRows.length) {
    const { data, error } = await supabase.from("story_entities").insert(entityRows).select("*");
    if (error) return json({ error: `Failed to save entities: ${error.message}` }, 500);
    insertedEntities = data ?? [];
  }

  const eventRows = eventsIn
    .filter((e: any) => e && typeof e.title === "string")
    .map((e: any, i: number) => ({
      project_id: projectId,
      timeline_id: null,
      title: String(e.title).slice(0, 200),
      description: e.description ? String(e.description) : null,
      story_time: e.story_time ? String(e.story_time) : null,
      sequence_order: typeof e.sequence_order === "number" ? e.sequence_order : i,
      emotional_impact: e.emotional_impact ? String(e.emotional_impact) : null,
      canon_status: "proposed",
    }));

  let insertedEvents: any[] = [];
  if (eventRows.length) {
    const { data, error } = await supabase.from("story_events").insert(eventRows).select("*");
    if (error) return json({ error: `Failed to save events: ${error.message}` }, 500);
    insertedEvents = data ?? [];
  }

  let document: any = null;
  if (parsed.document && typeof parsed.document.content === "string") {
    const title = String(parsed.document.title || "Story Bible").slice(0, 200);
    const content = parsed.document.content as string;
    const { data: posRow } = await supabase
      .from("documents")
      .select("position")
      .eq("project_id", projectId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = ((posRow?.position as number | undefined) ?? -1) + 1;
    const { data, error } = await supabase
      .from("documents")
      .insert({
        project_id: projectId,
        title,
        document_type: "story_bible",
        position: nextPos,
        status: "draft",
        current_content: content,
        word_count: content.split(/\s+/).filter(Boolean).length,
        created_by: userId,
      })
      .select("id, title, status")
      .single();
    if (error) return json({ error: `Failed to save Story Bible: ${error.message}` }, 500);
    document = data;
  }

  return json({
    ok: true,
    model: MODEL,
    logline: typeof parsed.logline === "string" ? parsed.logline : "",
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    entities: insertedEntities,
    events: insertedEvents,
    document,
  });
}

async function analyzeContinuity(
  supabase: any,
  projectId: string,
  documentId: string,
  content: string,
) {
  const { data: entities } = await supabase
    .from("story_entities")
    .select("name, entity_type, summary, canon_status")
    .eq("project_id", projectId)
    .eq("canon_status", "approved")
    .limit(80);

  const system = `You are a continuity editor. Return STRICT JSON only:
{
  "summary": string,
  "score": number (0-100),
  "issues": [{
    "issue_type": "contradiction"|"timeline"|"character_voice"|"world_rule"|"unresolved_thread",
    "severity": "info"|"warning"|"critical",
    "title": string,
    "explanation": string,
    "evidence": [{ "source": string, "quote": string, "reason": string }],
    "suggested_fix": string
  }]
}`;

  const user = `APPROVED CANON:
${JSON.stringify(entities ?? [], null, 2)}

SCENE:
${content.slice(0, 12000)}

Return JSON only.`;

  const raw = await callOpenRouter(system, user);
  const parsed = extractJson(raw);

  const severities = new Set(["info", "warning", "critical"]);
  const types = new Set([
    "contradiction",
    "timeline",
    "character_voice",
    "world_rule",
    "unresolved_thread",
  ]);
  const issuesIn = Array.isArray(parsed.issues) ? parsed.issues : [];

  const rows = issuesIn
    .filter((i: any) => i && typeof i.title === "string")
    .map((i: any) => ({
      project_id: projectId,
      document_id: documentId,
      issue_type: types.has(i.issue_type) ? i.issue_type : "contradiction",
      severity: severities.has(i.severity) ? i.severity : "info",
      title: String(i.title).slice(0, 200),
      explanation: i.explanation ? String(i.explanation) : null,
      evidence: Array.isArray(i.evidence) ? i.evidence : [],
      suggested_fix: i.suggested_fix ? String(i.suggested_fix) : null,
      status: "open",
    }));

  let issues: any[] = [];
  if (rows.length) {
    const { data, error } = await supabase.from("consistency_issues").insert(rows).select("*");
    if (error) return json({ error: `Failed to save issues: ${error.message}` }, 500);
    issues = data ?? [];
  }

  return json({
    ok: true,
    model: MODEL,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    score: typeof parsed.score === "number" ? parsed.score : 0,
    issues,
  });
}

async function generateDevelopmentPack(
  supabase: any,
  projectId: string,
  format: string,
  direction: string,
  userId: string | null,
) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("title, genre, premise")
    .eq("id", projectId)
    .single();
  if (error || !project) return json({ error: "Project not found" }, 404);
  const movie = format === "movie";
  const system = `You are an experienced story editor and screenwriter. Return STRICT JSON only.
Schema: {
  "suggestions": string[],
  "character_arcs": [{"name": string, "role": string, "want": string, "need": string, "flaw": string, "arc": string}],
  "beats": [{"title": string, "purpose": string, "turning_point": string}],
  "document": {"title": string, "content": string}
}
Give concrete, usable development material. ${movie ? "For a feature film, structure 12-15 cinematic beats across setup, escalation, midpoint, crisis, climax, and resolution; include visual set pieces and a strong ending." : "For an ongoing story, create a flexible next-act plan with 8-10 beats, escalating conflict, character growth, and future branch opportunities."}
Keep every character arc specific to the premise and avoid generic advice.`;
  const user = `PROJECT\nTitle: ${project.title}\nGenre: ${project.genre ?? "unspecified"}\nPremise: ${project.premise ?? ""}\n\nDIRECTION\n${direction || "Explore the strongest version of this story."}\n\nReturn JSON only.`;
  const parsed = extractJson(await callOpenRouter(system, user));
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.map((v: unknown) => String(v)).slice(0, 12)
    : [];
  const arcs = Array.isArray(parsed.character_arcs)
    ? parsed.character_arcs.filter((v: any) => v && typeof v.name === "string").slice(0, 12)
    : [];
  const beats = Array.isArray(parsed.beats)
    ? parsed.beats.filter((v: any) => v && typeof v.title === "string").slice(0, 20)
    : [];
  const { data: existingCharacters } = await supabase
    .from("story_entities")
    .select("name, entity_type")
    .eq("project_id", projectId)
    .eq("entity_type", "character");
  const existingNames = new Set(
    (existingCharacters ?? []).map((entity: any) => String(entity.name).trim().toLowerCase()),
  );
  const generatedNames = new Set<string>();
  const entityRows = arcs
    .map((arc: any) => ({
      project_id: projectId,
      entity_type: "character",
      name: String(arc.name).trim().slice(0, 200),
      summary: String(arc.arc || arc.need || "").slice(0, 1000) || null,
      attributes: { role: arc.role, want: arc.want, need: arc.need, flaw: arc.flaw, arc: arc.arc },
      canon_status: "proposed",
      created_by: userId,
    }))
    .filter((entity: any) => {
      const key = entity.name.toLowerCase();
      if (!entity.name || existingNames.has(key) || generatedNames.has(key)) return false;
      generatedNames.add(key);
      return true;
    });
  let characterArcs: any[] = [];
  if (entityRows.length) {
    const result = await supabase.from("story_entities").insert(entityRows).select("*");
    if (result.error)
      return json({ error: `Failed to save character development: ${result.error.message}` }, 500);
    characterArcs = result.data ?? [];
  }
  if (beats.length) {
    const { data: primaryTimeline } = await supabase
      .from("timelines")
      .select("id")
      .eq("project_id", projectId)
      .eq("is_primary", true)
      .maybeSingle();
    const eventRows = beats.map((beat: any, index: number) => ({
      project_id: projectId,
      timeline_id: primaryTimeline?.id ?? null,
      title: String(beat.title).slice(0, 200),
      description:
        String(beat.purpose || beat.turning_point || "Generated story beat.").slice(0, 1000) ||
        "Generated story beat.",
      sequence_order: index,
      emotional_impact: null,
      canon_status: "proposed",
    }));
    const result = await supabase.from("story_events").insert(eventRows);
    if (result.error)
      return json({ error: `Failed to save story beats: ${result.error.message}` }, 500);
  }
  let document: any = null;
  if (parsed.document && typeof parsed.document.content === "string") {
    const { data: posRow } = await supabase
      .from("documents")
      .select("position")
      .eq("project_id", projectId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const result = await supabase
      .from("documents")
      .insert({
        project_id: projectId,
        title: String(
          parsed.document.title || (movie ? "Feature Film Treatment" : "Next Story Act"),
        ).slice(0, 200),
        document_type: "outline",
        position: ((posRow?.position as number | undefined) ?? -1) + 1,
        status: "draft",
        current_content: parsed.document.content,
        word_count: String(parsed.document.content).split(/\s+/).filter(Boolean).length,
        created_by: userId,
      })
      .select("id, title, status")
      .single();
    if (result.error)
      return json({ error: `Failed to save development plan: ${result.error.message}` }, 500);
    document = result.data;
  }
  return json({
    ok: true,
    model: MODEL,
    suggestions,
    character_arcs: characterArcs,
    beats,
    document,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    let userId: string | null = null;
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "generate_story_dna") {
      if (!body.projectId) return json({ error: "projectId required" }, 400);
      return await generateStoryDna(supabase, body.projectId, body.creativeDirection ?? "", userId);
    }
    if (action === "analyze_continuity") {
      if (!body.projectId || !body.documentId)
        return json({ error: "projectId and documentId required" }, 400);
      return await analyzeContinuity(supabase, body.projectId, body.documentId, body.content ?? "");
    }
    if (action === "generate_development_pack") {
      if (!body.projectId) return json({ error: "projectId required" }, 400);
      return await generateDevelopmentPack(
        supabase,
        body.projectId,
        body.format ?? "story",
        body.direction ?? "",
        userId,
      );
    }
    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    if (err instanceof Response) return err;
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: msg }, 500);
  }
});
