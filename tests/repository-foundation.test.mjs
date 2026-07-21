import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const migration = fs.readFileSync(
  "supabase/migrations/20260721000000_phase1_foundation.sql",
  "utf8",
);
test("all user tables enable RLS", () => {
  for (const table of [
    "projects",
    "project_members",
    "story_entities",
    "documents",
    "document_revisions",
    "continuity_scans",
    "consistency_issues",
    "generation_jobs",
    "generation_outputs",
    "ai_usage_logs",
  ])
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
});
test("project bootstrap is atomic and complete", () => {
  assert.match(migration, /create function public\.bootstrap_project/);
  assert.match(migration, /insert into project_members/);
  assert.match(migration, /insert into timelines/);
});
test("cross-project constraints and deduplicated revisions exist", () => {
  assert.match(migration, /validate_same_project/);
  assert.match(migration, /unique\(document_id,content_hash\)/);
  assert.match(migration, /unique\(document_id,version_number\)/);
});
