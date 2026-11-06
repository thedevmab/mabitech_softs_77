import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, jsonError } from "@/lib/api";
import { useLocalStorage, localPath } from "@/lib/storage/local";
import { verifyLocalDownloadSignature } from "@/lib/storage/signed-local";
import { hashToken } from "@/lib/utils";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";

export async function GET(request: Request) {
  try {
    if (!useLocalStorage() && process.env.STORAGE_DRIVER !== "local") {
      return jsonError(404, "NOT_AVAILABLE", "Local file serving is disabled");
    }

    const ip = getClientIp(request);
    const rl = await rateLimit(`downloads:local:${ip}`, 60, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many download requests");
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const grant = searchParams.get("grant");
    const exp = Number(searchParams.get("exp") || 0);
    const sig = searchParams.get("sig") || "";
    const filename = searchParams.get("filename") || undefined;

    if (!key) throw new ApiError(400, "MISSING_KEY", "File key is required");

    // Prevent path traversal
    if (key.includes("..") || key.startsWith("/") || key.includes("\\")) {
      throw new ApiError(400, "INVALID_KEY", "Invalid storage key");
    }

    let authorized = false;

    if (grant) {
      const tokenHash = hashToken(grant);
      const grantRow = await prisma.downloadGrant.findUnique({
        where: { tokenHash },
        include: { file: true },
      });
      if (
        grantRow &&
        grantRow.expiresAt > new Date() &&
        grantRow.file.storageKey === key
      ) {
        authorized = true;
      }
    }

    if (!authorized && sig && exp) {
      authorized = verifyLocalDownloadSignature({ key, exp, filename, sig });
    }

    if (!authorized) {
      throw new ApiError(403, "FORBIDDEN", "Invalid or expired download authorization");
    }

    const fullPath = localPath(key);
    if (!existsSync(fullPath)) {
      throw new ApiError(404, "NOT_FOUND", "File not found");
    }

    const stat = statSync(fullPath);
    const stream = createReadStream(fullPath);
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

    const downloadName = filename || key.split("/").pop() || "download";
    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename="${downloadName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
