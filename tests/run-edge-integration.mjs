import fs from "node:fs";

const envPath = ".env.verify.local";
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}
process.env.SUPABASE_URL = "http://127.0.0.1:54321";
await import("./edge-integration.mjs");
