import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  parseJson,
} from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";
import { rateLimit } from "@/lib/redis";
import { getClientIp, getUserAgent } from "@/lib/api/request";
import { sha256 } from "@/lib/utils";

const schema = z.object({
  eventKey: z.string().min(8).max(200),
  softwareId: z.string().optional(),
  fileId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const ip = getClientIp(request);
    const rl = await rateLimit(`downloads:complete:${user.id}:${ip}`, 60, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many download completion reports");
    }

    const body = await parseJson(request, schema);

    const existing = await prisma.downloadEvent.findUnique({
      where: { eventKey: body.eventKey },
    });

    if (existing) {
      if (existing.type === "COMPLETED") {
        return jsonOk({
          completed: true,
          alreadyRecorded: true,
          installed: false,
          message: "Download already marked completed. Installation is never inferred.",
        });
      }
      // eventKey unique — create a completed sibling keyed distinctly
    }

    const initiated = await prisma.downloadEvent.findFirst({
      where: {
        userId: user.id,
        type: "INITIATED",
        OR: [
          { eventKey: body.eventKey },
          ...(body.softwareId ? [{ softwareId: body.softwareId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const softwareId = body.softwareId || initiated?.softwareId;
    if (!softwareId) {
      throw new ApiError(400, "INVALID_EVENT", "Unable to resolve download event");
    }

    const completedKey = `completed:${body.eventKey}`;
    const already = await prisma.downloadEvent.findUnique({
      where: { eventKey: completedKey },
    });
    if (already) {
      return jsonOk({
        completed: true,
        alreadyRecorded: true,
        installed: false,
        message: "Download already marked completed. Installation is never inferred.",
      });
    }

    await prisma.downloadEvent.create({
      data: {
        softwareId,
        fileId: body.fileId || initiated?.fileId,
        userId: user.id,
        type: "COMPLETED",
        ipHash: sha256(ip),
        userAgent: getUserAgent(request),
        eventKey: completedKey,
      },
    });

    return jsonOk({
      completed: true,
      alreadyRecorded: false,
      installed: false,
      message: "Download marked completed. This never means the software was installed.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
