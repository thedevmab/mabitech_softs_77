import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
} from "@/lib/api";
import { requireActivePremium, requireApiUser } from "@/lib/auth/request-user";
import { createDownloadGrant, redeemDownloadGrant } from "@/lib/storage/files";
import { rateLimit } from "@/lib/redis";
import { getClientIp, getUserAgent } from "@/lib/api/request";
import { publicSoftwareWhere } from "@/lib/api/serializers";
import { sha256, randomToken } from "@/lib/utils";
import { absoluteUrl } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

const querySchema = z.object({
  fileId: z.string().optional(),
  versionId: z.string().optional(),
});

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const ip = getClientIp(request);
    const rl = await rateLimit(`downloads:${user.id}:${ip}`, 30, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many download requests");
    }

    const { slug: idOrSlug } = await params;
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      fileId: searchParams.get("fileId") || undefined,
      versionId: searchParams.get("versionId") || undefined,
    });

    const software = await prisma.software.findFirst({
      where: {
        ...publicSoftwareWhere,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        files: {
          where: { verificationStatus: "VERIFIED" },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!software) throw new ApiError(404, "NOT_FOUND", "Software not found");

    if (software.isPremium) {
      await requireActivePremium(user.id);
    }

    if (software.channel === "EXTERNAL_URL") {
      if (!software.externalUrl) {
        throw new ApiError(400, "NO_DOWNLOAD", "No external URL configured");
      }
      const eventKey = `dl:${software.id}:${user.id}:${randomToken(8)}`;
      await prisma.downloadEvent.create({
        data: {
          softwareId: software.id,
          userId: user.id,
          type: "INITIATED",
          ipHash: sha256(ip),
          userAgent: getUserAgent(request),
          eventKey,
        },
      });
      await prisma.software.update({
        where: { id: software.id },
        data: { downloadCount: { increment: 1 } },
      });
      return jsonOk({
        channel: software.channel,
        url: software.externalUrl,
        eventKey,
        installed: false,
        message: "Outbound link issued. This does not mean the software was installed.",
      });
    }

    if (software.channel === "GOOGLE_PLAY") {
      if (!software.googlePlayUrl) {
        throw new ApiError(400, "NO_DOWNLOAD", "No Google Play URL configured");
      }
      const eventKey = `dl:${software.id}:${user.id}:${randomToken(8)}`;
      await prisma.downloadEvent.create({
        data: {
          softwareId: software.id,
          userId: user.id,
          type: "INITIATED",
          ipHash: sha256(ip),
          userAgent: getUserAgent(request),
          eventKey,
        },
      });
      return jsonOk({
        channel: software.channel,
        url: software.googlePlayUrl,
        eventKey,
        installed: false,
        message: "Store link issued. This does not mean the software was installed.",
      });
    }

    // HOSTED_FILE
    let file: (typeof software.files)[number] | null = software.files[0] ?? null;
    if (query.fileId) {
      file = software.files.find((f) => f.id === query.fileId) ?? null;
    } else if (query.versionId) {
      const fromList =
        software.files.find((f) => f.versionId === query.versionId) ?? null;
      file =
        fromList ||
        (await prisma.softwareFile.findFirst({
          where: {
            softwareId: software.id,
            versionId: query.versionId,
            verificationStatus: "VERIFIED",
          },
        }));
    }

    if (!file) {
      throw new ApiError(404, "FILE_NOT_FOUND", "No verified downloadable file available");
    }

    const grant = await createDownloadGrant({
      softwareId: software.id,
      fileId: file.id,
      userId: user.id,
      ttlSeconds: 120,
    });

    const redeemed = await redeemDownloadGrant(grant.token);
    const eventKey = `dl:${software.id}:${user.id}:${file.id}:${randomToken(8)}`;

    await prisma.downloadEvent.create({
      data: {
        softwareId: software.id,
        fileId: file.id,
        userId: user.id,
        type: "INITIATED",
        ipHash: sha256(ip),
        userAgent: getUserAgent(request),
        eventKey,
      },
    });
    await prisma.software.update({
      where: { id: software.id },
      data: { downloadCount: { increment: 1 } },
    });

    return jsonOk({
      channel: software.channel,
      url: redeemed.url,
      grantToken: grant.token,
      grantExpiresAt: grant.expiresAt,
      eventKey,
      file: {
        id: file.id,
        originalName: file.originalName,
        extension: file.extension,
        mimeType: file.mimeType,
        sizeBytes: Number(file.sizeBytes),
        checksumSha256: file.checksumSha256,
      },
      completeUrl: absoluteUrl("/api/v1/downloads/complete"),
      installed: false,
      message:
        "Download grant issued. Completing a download does not mean the software was installed.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
