import { supabase } from "@/integrations/supabase/client";
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

// ---------- helpers ----------

type DocumentRow = Omit<Document, "content"> & { current_content: string | null };

function mapDocument(row: DocumentRow): Document {
  const { current_content, ...rest } = row;
  return { ...rest, content: current_content ?? "" };
}

function supabaseMessage(error: { message?: string; hint?: string | null; details?: string | null }): string {
  return [error.message, error.hint, error.details].filter(Boolean).join(" · ") || "Supabase request failed";
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []) as unknown as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(supabaseMessage(error));
  return (data as unknown as Project) ?? null;
}

export async function createProject(input: {
  title: string;
  genre: string | null;
  premise: string | null;
  cover_style?: string | null;
}): Promise<Project> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      title: input.title,
      premise: input.premise ?? "",
      genre: input.genre,
      status: "draft",
      cover_style: input.cover_style ?? "violet",
      progress: 0,
    })
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return data as unknown as Project;
}

export async function listEntities(projectId: string): Promise<StoryEntity[]> {
  const { data, error } = await supabase
    .from("story_entities")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []) as unknown as StoryEntity[];
}

export async function upsertEntity(row: Partial<StoryEntity> & { project_id: string; name: string; entity_type: StoryEntity["entity_type"] }): Promise<StoryEntity> {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = {
    canon_status: "proposed" as const,
    ...row,
    created_by: row.created_by ?? user?.id ?? null,
  };
  const { data, error } = await supabase.from("story_entities").upsert(payload).select("*").single();
  if (error) throw new Error(supabaseMessage(error));
  return data as unknown as StoryEntity;
}

export async function listRelationships(projectId: string): Promise<EntityRelationship[]> {
  const { data, error } = await supabase.from("entity_relationships").select("*").eq("project_id", projectId);
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []) as unknown as EntityRelationship[];
}

export async function listTimelines(projectId: string): Promise<Timeline[]> {
  const { data, error } = await supabase.from("timelines").select("*").eq("project_id", projectId).order("is_primary", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []) as unknown as Timeline[];
}

export async function listEvents(projectId: string): Promise<StoryEvent[]> {
  const { data, error } = await supabase
    .from("story_events")
    .select("*")
    .eq("project_id", projectId)
    .order("sequence_order", { ascending: true });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []) as unknown as StoryEvent[];
}

export async function createEvent(input: {
  project_id: string;
  timeline_id: string | null;
  title: string;
  description?: string | null;
  story_time?: string | null;
  sequence_order?: number;
}): Promise<StoryEvent> {
  const { data, error } = await supabase
    .from("story_events")
    .insert({
      project_id: input.project_id,
      timeline_id: input.timeline_id,
      title: input.title,
      description: input.description ?? null,
      story_time: input.story_time ?? null,
      sequence_order: input.sequence_order ?? 0,
      canon_status: "proposed",
    })
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return data as unknown as StoryEvent;
}

export async function listDocuments(projectId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });
  if (error) throw new Error(supabaseMessage(error));
  return ((data ?? []) as unknown as DocumentRow[]).map(mapDocument);
}

export async function getDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(supabaseMessage(error));
  return data ? mapDocument(data as unknown as DocumentRow) : null;
}

export async function updateDocument(id: string, patch: Partial<Document>): Promise<Document> {
  const { content, ...rest } = patch;
  const dbPatch: Record<string, unknown> = { ...rest };
  if (content !== undefined) dbPatch.current_content = content;
  const { data, error } = await supabase.from("documents").update(dbPatch).eq("id", id).select("*").single();
  if (error) throw new Error(supabaseMessage(error));
  return mapDocument(data as unknown as DocumentRow);
}

export async function createDocument(
  projectId: string,
  title: string,
  position: number,
  document_type: DocumentType = "chapter",
): Promise<Document> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      project_id: projectId,
      title,
      document_type,
      position,
      status: "draft",
      current_content: "",
      word_count: 0,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return mapDocument(data as unknown as DocumentRow);
}

export async function listRevisions(documentId: string): Promise<DocumentRevision[]> {
  const { data, error } = await supabase
    .from("document_revisions")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []) as unknown as DocumentRevision[];
}

export async function createRevision(input: {
  document_id: string;
  project_id: string;
  content: string;
  change_summary?: string | null;
}): Promise<DocumentRevision> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("document_revisions")
    .insert({
      document_id: input.document_id,
      project_id: input.project_id,
      content: input.content,
      change_summary: input.change_summary ?? null,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(supabaseMessage(error));
  return data as unknown as DocumentRevision;
}

export async function listIssues(projectId: string): Promise<ConsistencyIssue[]> {
  const { data, error } = await supabase
    .from("consistency_issues")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(supabaseMessage(error));
  return (data ?? []) as unknown as ConsistencyIssue[];
}

export async function updateIssue(id: string, patch: Partial<ConsistencyIssue>): Promise<ConsistencyIssue> {
  const { data: { user } } = await supabase.auth.getUser();
  const dbPatch: Record<string, unknown> = { ...patch };
  if (patch.status === "resolved") {
    dbPatch.resolved_by = user?.id ?? null;
    dbPatch.resolved_at = new Date().toISOString();
  }
  const { data, error } = await supabase.from("consistency_issues").update(dbPatch).eq("id", id).select("*").single();
  if (error) throw new Error(supabaseMessage(error));
  return data as unknown as ConsistencyIssue;
}