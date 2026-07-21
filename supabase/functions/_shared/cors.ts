import { AppError } from "./errors.ts";
const defaults = ["http://localhost:3000", "http://localhost:5173"];
export function corsFor(req: Request) {
  const origin = req.headers.get("origin");
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const allowed = [...defaults, ...configured];
  if (origin && !allowed.includes(origin) && !origin.endsWith(".lovable.app"))
    throw new AppError("PROJECT_ACCESS_DENIED", "Origin is not allowed.", 403);
  return {
    "Access-Control-Allow-Origin":
      (origin && allowed.includes(origin)) || origin?.endsWith(".lovable.app")
        ? origin
        : allowed[0],
    Vary: "Origin",
    "Access-Control-Allow-Headers":
      "authorization,x-client-info,apikey,content-type,x-idempotency-key",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}
