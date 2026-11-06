import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  handleApiError,
  jsonError,
  jsonOk,
  parseJson,
  privateNoStoreHeaders,
} from "@/lib/api";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";

const schema = z.object({
  format: z.enum(["banner", "interstitial", "native", "app_open"]),
  code: z.string().max(64).optional().nullable(),
  message: z.string().min(1).max(500),
});

const MAX_STORED = 200;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`ads:errors:${ip}`, 30, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many ad error reports");
    }

    const body = await parseJson(request, schema);

    await prisma.adMobClientError.create({
      data: {
        format: body.format,
        code: body.code?.trim() || null,
        message: body.message.trim().slice(0, 500),
      },
    });

    const count = await prisma.adMobClientError.count();
    if (count > MAX_STORED) {
      const oldest = await prisma.adMobClientError.findMany({
        orderBy: { createdAt: "asc" },
        take: count - MAX_STORED,
        select: { id: true },
      });
      if (oldest.length) {
        await prisma.adMobClientError.deleteMany({
          where: { id: { in: oldest.map((row) => row.id) } },
        });
      }
    }

    return jsonOk({ recorded: true }, { headers: privateNoStoreHeaders() });
  } catch (error) {
    return handleApiError(error);
  }
}
