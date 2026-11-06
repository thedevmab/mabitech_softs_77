import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// `prisma generate` validates env("DATABASE_URL") even though it never connects.
// A placeholder lets the production build finish when the host has not set one yet.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=public";
}

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run([path.join(root, "node_modules", "prisma", "build", "index.js"), "generate"]);
run([path.join(root, "node_modules", "next", "dist", "bin", "next"), "build"]);
