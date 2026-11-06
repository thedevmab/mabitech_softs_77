import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { logActivity } from "@/lib/audit";

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const cronHeader = request.headers.get("x-cron-secret");
  return cronHeader === secret;
}

export async function POST(request: Request) {
  try {
    if (!authorizeCron(request)) {
      return jsonError(401, "UNAUTHORIZED", "Invalid cron secret");
    }

    const now = new Date();
    const due = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        deletedAt: null,
        scheduledAt: { lte: now },
      },
      select: { id: true, title: true },
    });

    if (due.length === 0) {
      return jsonOk({ published: 0, ids: [] });
    }

    await prisma.post.updateMany({
      where: { id: { in: due.map((p) => p.id) } },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
      },
    });

    await logActivity({
      action: "cron.publish_scheduled",
      entityType: "Post",
      metadata: { count: due.length, ids: due.map((p) => p.id) },
    });

    return jsonOk({
      published: due.length,
      ids: due.map((p) => p.id),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  return POST(request);
}
