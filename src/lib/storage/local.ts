import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import { createReadStream } from "fs";

const ROOT = path.join(process.cwd(), "storage", "files");

export function useLocalStorage() {
  if (process.env.STORAGE_DRIVER === "local") return true;
  if (process.env.STORAGE_DRIVER === "s3") return false;
  return !process.env.S3_ENDPOINT;
}

export async function localUpload(params: {
  key: string;
  body: Buffer;
}) {
  const full = path.join(ROOT, params.key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, params.body);
  return { bucket: "local", key: params.key, path: full };
}

export async function localDelete(key: string) {
  const full = path.join(ROOT, key);
  await unlink(full).catch(() => undefined);
}

export async function localRead(key: string) {
  return readFile(path.join(ROOT, key));
}

export function localStream(key: string) {
  return createReadStream(path.join(ROOT, key));
}

export function localPath(key: string) {
  return path.join(ROOT, key);
}
