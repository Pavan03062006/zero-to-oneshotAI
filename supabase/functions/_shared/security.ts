import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AppError } from "./errors.ts";
export function serviceClient() {
  const localMode = Deno.env.get("ONESHOT_LOCAL_MODE") === "true";
  const url =
    Deno.env.get("SUPABASE_URL") ??
    (localMode ? Deno.env.get("ONESHOT_LOCAL_SUPABASE_URL") : undefined);
  const key =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    (localMode ? Deno.env.get("ONESHOT_LOCAL_SERVICE_ROLE_KEY") : undefined);
  if (!url || !key)
    throw new AppError("INTERNAL_ERROR", "Server configuration is incomplete.", 500);
  return createClient(url, key, { auth: { persistSession: false } });
}
export async function authenticate(req: Request, db: ReturnType<typeof serviceClient>) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer "))
    throw new AppError("UNAUTHENTICATED", "Sign in to continue.", 401);
  const { data, error } = await db.auth.getUser(header.slice(7));
  if (error || !data.user)
    throw new AppError("UNAUTHENTICATED", "Your session is invalid or expired.", 401);
  return data.user;
}
export async function authorize(
  db: ReturnType<typeof serviceClient>,
  projectId: string,
  userId: string,
  roles = "owner,editor".split(","),
) {
  const { data, error } = await db
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("project membership lookup failed", { projectId, userId, error });
    throw new AppError("INTERNAL_ERROR", "Authorization could not be checked.", 500);
  }
  if (!data)
    throw new AppError("PROJECT_ACCESS_DENIED", "You do not have access to this project.", 403);
  if (!roles.includes(data.role))
    throw new AppError("INSUFFICIENT_ROLE", "Your project role cannot perform this action.", 403);
}
export async function requireDocument(
  db: ReturnType<typeof serviceClient>,
  projectId: string,
  documentId: string,
) {
  const { data } = await db
    .from("documents")
    .select("id,current_content")
    .eq("id", documentId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) throw new AppError("RESOURCE_NOT_FOUND", "Document not found in this project.", 404);
  return data;
}
export async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}
