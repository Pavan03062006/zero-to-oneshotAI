export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          action: string
          completion_tokens: number | null
          created_at: string
          error_code: string | null
          id: string
          job_id: string | null
          latency_ms: number
          model: string
          project_id: string
          prompt_tokens: number | null
          provider: string
          success: boolean
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          action: string
          completion_tokens?: number | null
          created_at?: string
          error_code?: string | null
          id?: string
          job_id?: string | null
          latency_ms: number
          model: string
          project_id: string
          prompt_tokens?: number | null
          provider: string
          success: boolean
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          action?: string
          completion_tokens?: number | null
          created_at?: string
          error_code?: string | null
          id?: string
          job_id?: string | null
          latency_ms?: number
          model?: string
          project_id?: string
          prompt_tokens?: number | null
          provider?: string
          success?: boolean
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "generation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      consistency_issues: {
        Row: {
          confidence: number | null
          created_at: string
          document_id: string | null
          evidence: Json
          explanation: string | null
          id: string
          issue_type: string
          project_id: string
          resolved_at: string | null
          resolved_by: string | null
          scan_id: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          status: Database["public"]["Enums"]["issue_status"]
          suggested_fix: string | null
          title: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          document_id?: string | null
          evidence?: Json
          explanation?: string | null
          id?: string
          issue_type: string
          project_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          scan_id?: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          suggested_fix?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          document_id?: string | null
          evidence?: Json
          explanation?: string | null
          id?: string
          issue_type?: string
          project_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          scan_id?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          suggested_fix?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consistency_issues_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consistency_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consistency_issues_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "continuity_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      continuity_scans: {
        Row: {
          completed_at: string | null
          context_summary: Json
          created_at: string
          created_by: string
          document_id: string
          document_revision_id: string | null
          id: string
          input_hash: string
          model: string | null
          project_id: string
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["scan_status"]
        }
        Insert: {
          completed_at?: string | null
          context_summary?: Json
          created_at?: string
          created_by: string
          document_id: string
          document_revision_id?: string | null
          id?: string
          input_hash: string
          model?: string | null
          project_id: string
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["scan_status"]
        }
        Update: {
          completed_at?: string | null
          context_summary?: Json
          created_at?: string
          created_by?: string
          document_id?: string
          document_revision_id?: string | null
          id?: string
          input_hash?: string
          model?: string | null
          project_id?: string
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["scan_status"]
        }
        Relationships: [
          {
            foreignKeyName: "continuity_scans_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "continuity_scans_document_revision_id_fkey"
            columns: ["document_revision_id"]
            isOneToOne: false
            referencedRelation: "document_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "continuity_scans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_revisions: {
        Row: {
          change_summary: string | null
          content: string
          content_hash: string
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          project_id: string
          revision_source: Database["public"]["Enums"]["revision_source"]
          version_number: number
          word_count: number
        }
        Insert: {
          change_summary?: string | null
          content: string
          content_hash: string
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          project_id: string
          revision_source?: Database["public"]["Enums"]["revision_source"]
          version_number: number
          word_count?: number
        }
        Update: {
          change_summary?: string | null
          content?: string
          content_hash?: string
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          project_id?: string
          revision_source?: Database["public"]["Enums"]["revision_source"]
          version_number?: number
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_revisions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          current_content: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          order_index: number
          project_id: string
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          word_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_content?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          order_index?: number
          project_id: string
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          word_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_content?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          order_index?: number
          project_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_relationships: {
        Row: {
          canon_status: Database["public"]["Enums"]["canon_status"]
          created_at: string
          created_by: string | null
          description: string | null
          end_event_id: string | null
          id: string
          project_id: string
          relationship_type: string
          source_entity_id: string
          start_event_id: string | null
          target_entity_id: string
          updated_at: string
        }
        Insert: {
          canon_status?: Database["public"]["Enums"]["canon_status"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_event_id?: string | null
          id?: string
          project_id: string
          relationship_type: string
          source_entity_id: string
          start_event_id?: string | null
          target_entity_id: string
          updated_at?: string
        }
        Update: {
          canon_status?: Database["public"]["Enums"]["canon_status"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_event_id?: string | null
          id?: string
          project_id?: string
          relationship_type?: string
          source_entity_id?: string
          start_event_id?: string | null
          target_entity_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_relationships_end_event_id_fkey"
            columns: ["end_event_id"]
            isOneToOne: false
            referencedRelation: "story_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_relationships_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_relationships_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "story_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_relationships_start_event_id_fkey"
            columns: ["start_event_id"]
            isOneToOne: false
            referencedRelation: "story_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_relationships_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "story_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          action: string
          completed_at: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string
          input_hash: string
          model: string | null
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["generation_status"]
          user_id: string
        }
        Insert: {
          action: string
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key: string
          input_hash: string
          model?: string | null
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          user_id: string
        }
        Update: {
          action?: string
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string
          input_hash?: string
          model?: string | null
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["generation_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_outputs: {
        Row: {
          completion_tokens: number | null
          created_at: string
          estimated_cost: number | null
          id: string
          job_id: string
          prompt_tokens: number | null
          raw_response: Json
          total_tokens: number | null
          validated_output: Json
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          job_id: string
          prompt_tokens?: number | null
          raw_response: Json
          total_tokens?: number | null
          validated_output: Json
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          job_id?: string
          prompt_tokens?: number | null
          raw_response?: Json
          total_tokens?: number | null
          validated_output?: Json
        }
        Relationships: [
          {
            foreignKeyName: "generation_outputs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "generation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          canon_strictness: Database["public"]["Enums"]["canon_strictness"]
          cover_style: string
          created_at: string
          format: Database["public"]["Enums"]["project_format"]
          genre: string | null
          id: string
          logline: string
          owner_id: string
          point_of_view: string | null
          premise: string
          progress: number
          status: Database["public"]["Enums"]["project_status"]
          title: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          canon_strictness?: Database["public"]["Enums"]["canon_strictness"]
          cover_style?: string
          created_at?: string
          format?: Database["public"]["Enums"]["project_format"]
          genre?: string | null
          id?: string
          logline?: string
          owner_id: string
          point_of_view?: string | null
          premise?: string
          progress?: number
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          canon_strictness?: Database["public"]["Enums"]["canon_strictness"]
          cover_style?: string
          created_at?: string
          format?: Database["public"]["Enums"]["project_format"]
          genre?: string | null
          id?: string
          logline?: string
          owner_id?: string
          point_of_view?: string | null
          premise?: string
          progress?: number
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      story_entities: {
        Row: {
          attributes: Json
          canon_status: Database["public"]["Enums"]["canon_status"]
          created_at: string
          created_by: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          name: string
          project_id: string
          source_document_id: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json
          canon_status?: Database["public"]["Enums"]["canon_status"]
          created_at?: string
          created_by?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          name: string
          project_id: string
          source_document_id?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json
          canon_status?: Database["public"]["Enums"]["canon_status"]
          created_at?: string
          created_by?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          name?: string
          project_id?: string
          source_document_id?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_entities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_entities_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      story_events: {
        Row: {
          canon_status: Database["public"]["Enums"]["canon_status"]
          created_at: string
          created_by: string | null
          description: string | null
          emotional_impact: string | null
          id: string
          project_id: string
          sequence_number: number
          story_time: string | null
          timeline_id: string
          title: string
          updated_at: string
        }
        Insert: {
          canon_status?: Database["public"]["Enums"]["canon_status"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          emotional_impact?: string | null
          id?: string
          project_id: string
          sequence_number?: number
          story_time?: string | null
          timeline_id: string
          title: string
          updated_at?: string
        }
        Update: {
          canon_status?: Database["public"]["Enums"]["canon_status"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          emotional_impact?: string | null
          id?: string
          project_id?: string
          sequence_number?: number
          story_time?: string | null
          timeline_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_events_timeline_id_fkey"
            columns: ["timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          },
        ]
      }
      timelines: {
        Row: {
          branch_point: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_primary: boolean
          name: string
          parent_timeline_id: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          branch_point?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_primary?: boolean
          name: string
          parent_timeline_id?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          branch_point?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_primary?: boolean
          name?: string
          parent_timeline_id?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timelines_parent_timeline_id_fkey"
            columns: ["parent_timeline_id"]
            isOneToOne: false
            referencedRelation: "timelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timelines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_project: {
        Args: {
          p_canon_strictness?: Database["public"]["Enums"]["canon_strictness"]
          p_cover_style?: string
          p_format?: Database["public"]["Enums"]["project_format"]
          p_genre?: string
          p_logline?: string
          p_point_of_view?: string
          p_premise?: string
          p_title: string
          p_tone?: string
        }
        Returns: {
          canon_strictness: Database["public"]["Enums"]["canon_strictness"]
          cover_style: string
          created_at: string
          format: Database["public"]["Enums"]["project_format"]
          genre: string | null
          id: string
          logline: string
          owner_id: string
          point_of_view: string | null
          premise: string
          progress: number
          status: Database["public"]["Enums"]["project_status"]
          title: string
          tone: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_project_role: {
        Args: {
          p_project_id: string
          p_roles: Database["public"]["Enums"]["project_role"][]
          p_user_id: string
        }
        Returns: boolean
      }
      is_project_member: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      owns_project: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      persist_generation_result: {
        Args: {
          p_action: string
          p_completion_tokens?: number
          p_job_id: string
          p_latency_ms?: number
          p_model: string
          p_project_id: string
          p_prompt_tokens?: number
          p_raw: Json
          p_total_tokens?: number
          p_user_id: string
          p_validated: Json
        }
        Returns: Json
      }
      save_document_revision: {
        Args: {
          p_change_summary?: string
          p_content: string
          p_document_id: string
          p_revision_source?: Database["public"]["Enums"]["revision_source"]
        }
        Returns: {
          change_summary: string | null
          content: string
          content_hash: string
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          project_id: string
          revision_source: Database["public"]["Enums"]["revision_source"]
          version_number: number
          word_count: number
        }
        SetofOptions: {
          from: "*"
          to: "document_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      canon_status:
        | "proposed"
        | "approved"
        | "rejected"
        | "superseded"
        | "alternate"
        | "archived"
      canon_strictness: "flexible" | "balanced" | "strict"
      document_status:
        | "draft"
        | "review"
        | "approved"
        | "published"
        | "archived"
      document_type:
        | "chapter"
        | "story_bible"
        | "outline"
        | "treatment"
        | "note"
      entity_type:
        | "character"
        | "location"
        | "organization"
        | "object"
        | "world_rule"
        | "theme"
        | "plot_thread"
      generation_status:
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      issue_severity: "critical" | "high" | "medium" | "low"
      issue_status:
        | "open"
        | "accepted"
        | "dismissed"
        | "fixed"
        | "false_positive"
      project_format:
        | "novel"
        | "screenplay"
        | "series"
        | "short_story"
        | "other"
      project_role: "owner" | "editor" | "viewer"
      project_status: "active" | "archived"
      revision_source:
        | "manual"
        | "checkpoint"
        | "autosave"
        | "ai_edit"
        | "restore"
        | "import"
      scan_status: "queued" | "running" | "completed" | "failed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      canon_status: [
        "proposed",
        "approved",
        "rejected",
        "superseded",
        "alternate",
        "archived",
      ],
      canon_strictness: ["flexible", "balanced", "strict"],
      document_status: ["draft", "review", "approved", "published", "archived"],
      document_type: ["chapter", "story_bible", "outline", "treatment", "note"],
      entity_type: [
        "character",
        "location",
        "organization",
        "object",
        "world_rule",
        "theme",
        "plot_thread",
      ],
      generation_status: [
        "queued",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      issue_severity: ["critical", "high", "medium", "low"],
      issue_status: [
        "open",
        "accepted",
        "dismissed",
        "fixed",
        "false_positive",
      ],
      project_format: ["novel", "screenplay", "series", "short_story", "other"],
      project_role: ["owner", "editor", "viewer"],
      project_status: ["active", "archived"],
      revision_source: [
        "manual",
        "checkpoint",
        "autosave",
        "ai_edit",
        "restore",
        "import",
      ],
      scan_status: ["queued", "running", "completed", "failed", "cancelled"],
    },
  },
} as const
