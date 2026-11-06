import { execFile } from "child_process";
import { mkdir } from "fs/promises";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(process.cwd(), "backups");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `techplatform-${stamp}.sql`);

  await execFileAsync("pg_dump", [databaseUrl, "-f", outFile], {
    env: process.env,
  });

  console.log(`Backup written to ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
