export type EntityType =
  "character" | "location" | "organization" | "object" | "world_rule" | "theme" | "plot_thread";

export type CanonStatus =
  "proposed" | "approved" | "rejected" | "superseded" | "alternate" | "archived";

export type DocumentType = "chapter" | "outline" | "story_bible" | "treatment" | "note";
export type DocumentStatus = "draft" | "review" | "approved" | "published";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  premise: string;
  genre: string | null;
  logline: string;
  format: "novel" | "screenplay" | "series" | "short_story" | "other";
  tone: string | null;
  point_of_view: string | null;
  canon_strictness: "flexible" | "balanced" | "strict";
  status: "active" | "archived";
  cover_style: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface StoryEntity {
  id: string;
  project_id: string;
  entity_type: EntityType;
  name: string;
  summary: string | null;
  attributes: Record<string, unknown> | null;
  canon_status: CanonStatus;
  source_document_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntityRelationship {
  id: string;
  project_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  description: string | null;
  start_event_id: string | null;
  end_event_id: string | null;
  created_by: string | null;
  canon_status: CanonStatus;
  created_at: string;
  updated_at: string;
}

export interface Timeline {
  id: string;
  project_id: string;
  name: string;
  is_primary: boolean;
  description: string | null;
  parent_timeline_id: string | null;
  branch_point: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryEvent {
  id: string;
  project_id: string;
  timeline_id: string | null;
  title: string;
  description: string | null;
  story_time: string | null;
  sequence_order: number;
  emotional_impact: string | null;
  canon_status: CanonStatus;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  title: string;
  document_type: DocumentType;
  position: number;
  status: DocumentStatus;
  word_count: number;
  /** UI-friendly alias for `current_content` from the database. */
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRevision {
  id: string;
  document_id: string;
  project_id: string;
  content: string;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "accepted" | "dismissed" | "fixed" | "false_positive";
export type IssueType =
  "contradiction" | "timeline" | "character_voice" | "world_rule" | "unresolved_thread";

export interface IssueEvidence {
  source: string;
  quote: string;
  reason: string;
}

export interface ConsistencyIssue {
  id: string;
  project_id: string;
  document_id: string | null;
  issue_type: IssueType | string;
  severity: IssueSeverity;
  title: string;
  explanation: string | null;
  evidence: IssueEvidence[] | null;
  suggested_fix: string | null;
  status: IssueStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}
