# ONESHOT Phase 1 backend

## Local setup

Prerequisites: Bun, Docker/Podman, and Supabase CLI. In constrained environments, `npx --yes supabase` and `npx --yes deno` can provide the CLI/runtime, but database tests, type generation, and function serving still require the container runtime.

1. Copy `.env.example` to `.env.local` and fill browser-safe local keys.
2. Run `supabase start`, then `supabase db reset`.
3. Set Edge Function secrets with `supabase secrets set --env-file .env.local` (use a separate server-only file in production).
4. Serve the function with `supabase functions serve story-engine --no-verify-jwt`. The function still verifies the bearer token itself; omitting gateway verification is only for local parity.
5. Generate types after schema changes:
   `supabase gen types typescript --local > src/integrations/supabase/database.types.ts`.
6. Run `bun install`, `bun run typecheck`, `bun run lint`, `bun test`, and `bun run dev`.
7. Read `docs/phase1-verification.md` for the last verified environment and any blocked checks.

Production must deploy migrations before the function and set `ALLOWED_ORIGINS`. Never put `SUPABASE_SERVICE_ROLE_KEY` or `OPENROUTER_API_KEY` in a `VITE_*` variable.

## Responsibilities

- The browser uses the typed anonymous client. RLS is the mandatory authorization boundary for direct CRUD.
- `bootstrap_project` atomically creates a project, owner membership, and primary timeline.
- Owners/editors write project content; viewers only read; non-members see nothing.
- The Edge Function verifies the JWT, membership, role, and referenced document before using the service role.
- AI requests become `generation_jobs`; validated responses are saved atomically with `generation_outputs` and `ai_usage_logs`.
- Input hashes plus idempotency keys prevent duplicate generation. Database-backed job counts enforce rate limits.
- Errors use `{ error: { code, message, requestId } }`; internal provider/SQL details remain in server logs.

## AI job lifecycle

`queued/running -> completed|failed|cancelled`. The function validates requests, checks a recent identical job, invokes OpenRouter with timeout and bounded transient retries, validates complete JSON, then calls the service-only atomic persistence RPC. Continuity scans deliberately use only approved entity summaries in Phase 1.

## Schema map

```text
auth.users ── profiles
     └── projects ── project_members
           ├── timelines ── story_events
           ├── documents ── document_revisions
           │      └── continuity_scans ── consistency_issues
           ├── story_entities ── entity_relationships
           └── generation_jobs ── generation_outputs
                    └── ai_usage_logs
```

## Security model

- Owner: read/write content, membership administration, archive/delete project.
- Editor: read/write content and invoke mutating AI actions; cannot administer ownership.
- Viewer: read-only and cannot invoke AI mutation actions.
- Non-member: no project or child-resource access.
- Service-role use is limited to the authenticated Edge Function and a service-only atomic persistence RPC.
- Security-definer membership helpers have explicit `search_path`, narrowly scoped behavior, and revoked public execution.

## Migration and test commands

```sh
supabase db reset
supabase test db
deno test supabase/functions/_shared --allow-env
bun run typecheck
bun run lint
bun test
bun run build
```
