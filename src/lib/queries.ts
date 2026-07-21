import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/database.types";
import type {
  Project,
  StoryEntity,
  Timeline,
  StoryEvent,
  Document,
  DocumentRevision,
  ConsistencyIssue,
  EntityRelationship,
  DocumentType,
} from "@/lib/types";

// ---------- generated-row mappers ----------

type Tables = Database["public"]["Tables"];
type DbDocument = Tables["documents"]["Row"];
type DbEntity = Tables["story_entities"]["Row"];
type DbEvent = Tables["story_events"]["Row"];
type DbIssue = Tables["consistency_issues"]["Row"];

function jsonObject(value: Json): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function mapDocument(row: DbDocument): Document {
  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    document_type: row.document_type,
    position: row.order_index,
    status: row.status === "archived" ? "draft" : row.status,
    word_count: row.word_count,
    content: row.current_content,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapEntity(row: DbEntity): StoryEntity {
  return { ...row, attributes: jsonObject(row.attributes) };
}

function mapEvent(row: DbEvent): StoryEvent {
  return { ...row, sequence_order: Number(row.sequence_number) };
}

function mapIssue(row: DbIssue): ConsistencyIssue {
  const evidence = Array.isArray(row.evidence)
    ? row.evidence.flatMap((item) => {
        if (item === null || typeof item !== "object" || Array.isArray(item)) return [];
        const source = item.source,
          quote = item.quote,
          reason = item.reason;
        return typeof source === "string" && typeof quote === "string" && typeof reason === "string"
          ? [{ source, quote, reason }]
          : [];
      })
    : [];
  return { ...row, evidence };
}

function supabaseMessage(error: {
  message?: string;
  hint?: string | null;
  details?: string | null;
}): string {
  return (
    [error.message, error.hint, error.details].filter(Boolean).join(" · ") ||
    "Supabase request failed"
  );
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, "title" | "premise" | "genre" | "status" | "cover_style">>,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return data;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(supabaseMessage(error));
  return data;
}

export async function createProject(input: {
  title: string;
  genre: string | null;
  premise: string | null;
  logline?: string;
  format?: Project["format"];
  tone?: string | null;
  point_of_view?: string | null;
  canon_strictness?: Project["canon_strictness"];
  cover_style?: string | null;
}): Promise<Project> {
  const { data, error } = await supabase.rpc("bootstrap_project", {
    p_title: input.title,
    p_premise: input.premise ?? "",
    p_logline: input.logline ?? "",
    ...(input.genre === null ? {} : { p_genre: input.genre }),
    p_format: input.format ?? "novel",
    ...(input.tone == null ? {} : { p_tone: input.tone }),
    ...(input.point_of_view == null ? {} : { p_point_of_view: input.point_of_view }),
    p_canon_strictness: input.canon_strictness ?? "balanced",
    p_cover_style: input.cover_style ?? "violet",
  });
  if (error) throw new Error(supabaseMessage(error));
  return data;
}

export async function listEntities(projectId: string): Promise<StoryEntity[]> {
  const { data, error } = await supabase
    .from("story_entities")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []).map(mapEntity);
}

export async function upsertEntity(
  row: Partial<StoryEntity> & {
    project_id: string;
    name: string;
    entity_type: StoryEntity["entity_type"];
  },
): Promise<StoryEntity> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const payload = {
    canon_status: "proposed" as const,
    ...row,
    attributes: (row.attributes ?? {}) as Json,
    created_by: row.created_by ?? user?.id ?? null,
  };
  const { data, error } = await supabase
    .from("story_entities")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return mapEntity(data);
}

export async function deleteEntity(id: string): Promise<void> {
  const { error } = await supabase.from("story_entities").delete().eq("id", id);
  if (error) throw new Error(supabaseMessage(error));
}

export async function listRelationships(projectId: string): Promise<EntityRelationship[]> {
  const { data, error } = await supabase
    .from("entity_relationships")
    .select("*")
    .eq("project_id", projectId);
  if (error) throw new Error(supabaseMessage(error));
  return data ?? [];
}

export async function listTimelines(projectId: string): Promise<Timeline[]> {
  const { data, error } = await supabase
    .from("timelines")
    .select("*")
    .eq("project_id", projectId)
    .order("is_primary", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return data ?? [];
}

export async function createTimeline(input: {
  project_id: string;
  name: string;
  description?: string | null;
  parent_timeline_id?: string | null;
  branch_point?: string | null;
}): Promise<Timeline> {
  const { data, error } = await supabase
    .from("timelines")
    .insert({
      project_id: input.project_id,
      name: input.name,
      // The database requires a description even for a newly-created branch.
      description:
        input.description?.trim() || "Alternate timeline branched from the primary canon.",
      parent_timeline_id: input.parent_timeline_id ?? null,
      branch_point: input.branch_point ?? null,
      is_primary: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return data;
}

export async function listEvents(projectId: string): Promise<StoryEvent[]> {
  const { data, error } = await supabase
    .from("story_events")
    .select("*")
    .eq("project_id", projectId)
    .order("sequence_number", { ascending: true });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []).map(mapEvent);
}

export async function createEvent(input: {
  project_id: string;
  timeline_id: string | null;
  title: string;
  description?: string | null;
  story_time?: string | null;
  sequence_order?: number;
}): Promise<StoryEvent> {
  if (!input.timeline_id) throw new Error("Select a timeline before adding a story beat");
  const { data, error } = await supabase
    .from("story_events")
    .insert({
      project_id: input.project_id,
      timeline_id: input.timeline_id,
      title: input.title,
      description: input.description ?? null,
      story_time: input.story_time ?? null,
      sequence_number: input.sequence_order ?? 0,
      canon_status: "proposed",
    })
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return mapEvent(data);
}

export async function updateEvent(
  id: string,
  patch: Partial<
    Pick<StoryEvent, "title" | "description" | "story_time" | "sequence_order" | "timeline_id">
  >,
): Promise<StoryEvent> {
  const { data, error } = await supabase
    .from("story_events")
    .update({ ...patch, sequence_number: patch.sequence_order, sequence_order: undefined } as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return mapEvent(data);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("story_events").delete().eq("id", id);
  if (error) throw new Error(supabaseMessage(error));
}

export async function listDocuments(projectId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []).map(mapDocument);
}

export async function getDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(supabaseMessage(error));
  return data ? mapDocument(data) : null;
}

export async function updateDocument(id: string, patch: Partial<Document>): Promise<Document> {
  const { content, position, ...rest } = patch;
  const dbPatch: Database["public"]["Tables"]["documents"]["Update"] = {
    title: rest.title,
    document_type: rest.document_type,
    status: rest.status,
    word_count: rest.word_count,
  };
  if (content !== undefined) dbPatch.current_content = content;
  if (position !== undefined) dbPatch.order_index = position;
  const { data, error } = await supabase
    .from("documents")
    .update(dbPatch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return mapDocument(data);
}

export async function createDocument(
  projectId: string,
  title: string,
  position: number,
  document_type: DocumentType = "chapter",
): Promise<Document> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      project_id: projectId,
      title,
      document_type,
      order_index: position,
      status: "draft",
      current_content: "",
      word_count: 0,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return mapDocument(data);
}

export async function listRevisions(documentId: string): Promise<DocumentRevision[]> {
  const { data, error } = await supabase
    .from("document_revisions")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return data ?? [];
}

export async function createRevision(input: {
  document_id: string;
  project_id: string;
  content: string;
  change_summary?: string | null;
}): Promise<DocumentRevision> {
  const { data, error } = await supabase.rpc("save_document_revision", {
    p_document_id: input.document_id,
    p_content: input.content,
    ...(input.change_summary == null ? {} : { p_change_summary: input.change_summary }),
    p_revision_source: "autosave",
  });
  if (error) throw new Error(supabaseMessage(error));
  return data;
}

export async function listIssues(projectId: string): Promise<ConsistencyIssue[]> {
  const { data, error } = await supabase
    .from("consistency_issues")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []).map(mapIssue);
}

export async function updateIssue(
  id: string,
  patch: Partial<ConsistencyIssue>,
): Promise<ConsistencyIssue> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const dbPatch: Database["public"]["Tables"]["consistency_issues"]["Update"] = {
    issue_type: patch.issue_type,
    severity: patch.severity,
    title: patch.title,
    explanation: patch.explanation,
    evidence: patch.evidence as unknown as Json | undefined,
    suggested_fix: patch.suggested_fix,
    status: patch.status,
  };
  if (patch.status === "fixed") {
    dbPatch.resolved_by = user?.id ?? null;
    dbPatch.resolved_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from("consistency_issues")
    .update(dbPatch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return mapIssue(data);
}
