import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import { ApiError, handleApiError } from "@/lib/api";
import { localPath, useLocalStorage as isLocalStorageDriver } from "@/lib/storage/local";
import { getPresignedDownloadUrl } from "@/lib/storage/s3";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";

type Params = { params: Promise<{ key: string[] }> };

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

function contentTypeFor(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`media:${ip}`, 120, 60);
    if (!rl.allowed) {
      throw new ApiError(429, "RATE_LIMITED", "Too many media requests");
    }

    const { key: parts } = await params;
    const key = parts.join("/");

    if (
      !key ||
      key.includes("..") ||
      key.startsWith("/") ||
      key.includes("\\") ||
      !key.startsWith("media/")
    ) {
      throw new ApiError(400, "INVALID_KEY", "Invalid media key");
    }

    const ext = key.split(".").pop()?.toLowerCase() || "";
    if (!IMAGE_EXT.has(ext)) {
      throw new ApiError(400, "INVALID_KEY", "Only image media keys are served");
    }

    if (isLocalStorageDriver()) {
      const fullPath = localPath(key);
      if (!existsSync(fullPath)) {
        throw new ApiError(404, "NOT_FOUND", "Media not found");
      }
      const stat = statSync(fullPath);
      const stream = createReadStream(fullPath);
      const webStream = Readable.toWeb(stream) as unknown as ReadableStream;
      return new Response(webStream, {
        status: 200,
        headers: {
          "Content-Type": contentTypeFor(key),
          "Content-Length": String(stat.size),
          "Cache-Control": "public, max-age=86400, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // S3: redirect to a short-lived signed URL
    const url = await getPresignedDownloadUrl(key, 300);
    return Response.redirect(url, 302);
  } catch (error) {
    return handleApiError(error);
  }
}
