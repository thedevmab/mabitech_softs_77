import { prisma } from "@/lib/db";
import { ApiError, handleApiError, jsonError, jsonOk, privateNoStoreHeaders } from "@/lib/api";
import { publicPostWhere } from "@/lib/api/serializers";
import { createPostFileDownloadUrl } from "@/lib/storage/files";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";
import { sha256 } from "@/lib/utils";
import { serializePostFile } from "@/lib/api/serializers";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const ip = getClientIp(request);
    const ipHash = sha256(ip);
    const rl = await rateLimit(`posts:dl:${ipHash}`, 60, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many download requests");
    }

    const { slug } = await params;
    const post = await prisma.post.findFirst({
      where: {
        ...publicPostWhere(),
        OR: [{ slug }, { id: slug }],
        deliveryType: "FILE",
      },
      include: { file: true },
    });

    if (!post) throw new ApiError(404, "NOT_FOUND", "Post not found");
    if (!post.file) {
      throw new ApiError(404, "FILE_NOT_FOUND", "No downloadable file available");
    }

    const url = await createPostFileDownloadUrl({
      storageKey: post.file.storageKey,
      originalName: post.file.originalName,
      ttlSeconds: 120,
    });

    await prisma.postFile.update({
      where: { id: post.file.id },
      data: { downloadCount: { increment: 1 } },
    });

    return jsonOk(
      {
        url,
        file: serializePostFile(post.file),
        checksumSha256: post.file.checksumSha256,
        installed: false,
        message:
          "Download URL issued. Completing a download does not mean the file was installed.",
      },
      { headers: privateNoStoreHeaders() },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
