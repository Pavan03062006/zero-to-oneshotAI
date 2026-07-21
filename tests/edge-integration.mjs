import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const anon = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!anon || !serviceKey)
  throw new Error("SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY required");
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const endpoint = `${url}/functions/v1/story-engine`;
const password = "Verification-password-123!";
const createdUsers = [];
let passed = 0;

async function createUser(label) {
  const email = `${label}-${crypto.randomUUID()}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  createdUsers.push(data.user.id);
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const login = await client.auth.signInWithPassword({ email, password });
  if (login.error) throw login.error;
  return { id: data.user.id, client, token: login.data.session.access_token };
}

async function request(body, token, key) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:5173",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(key ? { "x-idempotency-key": key } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

function check(name, actual, expected) {
  assert.equal(actual, expected, name);
  passed += 1;
  console.log(`ok ${passed} - ${name}`);
}

try {
  const owner = await createUser("owner");
  const editor = await createUser("editor");
  const viewer = await createUser("viewer");
  const outsider = await createUser("outsider");
  const bootstrap = await owner.client.rpc("bootstrap_project", {
    p_title: "Edge verification",
    p_premise: "A secure premise",
    p_logline: "A secure logline",
    p_genre: "Fantasy",
    p_format: "novel",
    p_tone: "Hopeful",
    p_point_of_view: "Third limited",
    p_canon_strictness: "strict",
    p_cover_style: "violet",
  });
  if (bootstrap.error) throw bootstrap.error;
  const projectId = bootstrap.data.id;
  const memberInsert = await owner.client.from("project_members").insert([
    { project_id: projectId, user_id: editor.id, role: "editor" },
    { project_id: projectId, user_id: viewer.id, role: "viewer" },
  ]);
  if (memberInsert.error) throw memberInsert.error;
  const other = await outsider.client.rpc("bootstrap_project", { p_title: "Other project" });
  if (other.error) throw other.error;
  const otherDoc = await outsider.client
    .from("documents")
    .insert({ project_id: other.data.id, title: "Other document", created_by: outsider.id })
    .select("id")
    .single();
  if (otherDoc.error) throw otherDoc.error;

  check("missing token", (await request({}, null)).status, 401);
  check("malformed token", (await request({}, "invalid-token")).status, 401);
  check(
    "invalid UUID validation",
    (await request({ action: "generate_story_dna", projectId: "bad" }, owner.token)).status,
    400,
  );
  check(
    "unknown action validation",
    (await request({ action: "unknown", projectId }, owner.token)).status,
    400,
  );
  check(
    "oversized creative direction",
    (
      await request(
        { action: "generate_story_dna", projectId, creativeDirection: "x".repeat(4001) },
        owner.token,
      )
    ).status,
    400,
  );
  const viewerDenied = await request({ action: "generate_story_dna", projectId }, viewer.token);
  if (viewerDenied.status !== 403) console.error("viewer response", viewerDenied);
  check("viewer AI mutation denied", viewerDenied.status, 403);
  check(
    "outsider AI mutation denied",
    (await request({ action: "generate_story_dna", projectId }, outsider.token)).status,
    403,
  );
  check(
    "cross-project document denied",
    (
      await request(
        {
          action: "analyze_continuity",
          projectId,
          documentId: otherDoc.data.id,
          content: "Chapter",
        },
        owner.token,
      )
    ).status,
    404,
  );

  const cachedInput = { action: "generate_story_dna", projectId, creativeDirection: "cached" };
  const inputHash = crypto.createHash("sha256").update(JSON.stringify(cachedInput)).digest("hex");
  const cachedKey = `cached-${crypto.randomUUID()}`;
  const job = await admin
    .from("generation_jobs")
    .insert({
      project_id: projectId,
      user_id: owner.id,
      action: cachedInput.action,
      status: "completed",
      idempotency_key: cachedKey,
      input_hash: inputHash,
      model: "mock",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (job.error) throw job.error;
  const output = await admin.from("generation_outputs").insert({
    job_id: job.data.id,
    raw_response: {},
    validated_output: {
      _result: { logline: "cached", themes: [], entities: [], events: [], document: null },
    },
  });
  if (output.error) throw output.error;
  const cached = await request(cachedInput, owner.token, cachedKey);
  check("idempotent retry returns cached output", cached.status, 200);
  assert.equal(cached.body.cached, true);
  check(
    "same idempotency key with conflicting input",
    (await request({ ...cachedInput, creativeDirection: "different" }, owner.token, cachedKey))
      .status,
    409,
  );

  const filler = Array.from({ length: 19 }, (_, index) => ({
    project_id: projectId,
    user_id: owner.id,
    action: "generate_story_dna",
    status: "failed",
    idempotency_key: `rate-${index}-${crypto.randomUUID()}`,
    input_hash: crypto.randomUUID().replaceAll("-", ""),
  }));
  const rateRows = await admin.from("generation_jobs").insert(filler);
  if (rateRows.error) throw rateRows.error;
  check(
    "rate limit enforced per user/project/action",
    (
      await request(
        { action: "generate_story_dna", projectId, creativeDirection: "rate limited" },
        owner.token,
      )
    ).status,
    429,
  );

  const editorFailure = await request(
    { action: "generate_development_pack", projectId, format: "story", direction: "test" },
    editor.token,
  );
  check(
    "editor passes authorization and receives provider configuration failure",
    editorFailure.status,
    503,
  );
  const failedJob = await admin
    .from("generation_jobs")
    .select("status,error_code,completed_at")
    .eq("user_id", editor.id)
    .single();
  assert.equal(failedJob.data?.status, "failed");
  assert.equal(failedJob.data?.error_code, "AI_PROVIDER_FAILED");
  assert.ok(failedJob.data?.completed_at);
  check("failed AI lifecycle persisted", failedJob.error, null);

  console.log(`1..${passed}`);
} finally {
  for (const id of createdUsers) await admin.auth.admin.deleteUser(id);
}
