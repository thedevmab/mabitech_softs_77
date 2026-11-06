import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonOk,
  parseJson,
} from "@/lib/api";
import { publicPostWhere } from "@/lib/api/serializers";
import { getBearerUser } from "@/lib/auth/request-user";

type Params = { params: Promise<{ slug: string }> };

const schema = z.object({
  eventKey: z.string().min(8).max(128).optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { slug: idOrSlug } = await params;
    const body = await parseJson(request, schema).catch(() => ({ eventKey: undefined }));
    const user = await getBearerUser(request);

    const post = await prisma.post.findFirst({
      where: {
        ...publicPostWhere(),
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!post) throw new ApiError(404, "NOT_FOUND", "Post not found");

    const eventKey =
      body.eventKey ||
      `view:post:${post.id}:${user?.id || "anon"}:${new Date().toISOString().slice(0, 13)}`;

    const existing = await prisma.analyticsEvent.findUnique({ where: { eventKey } });
    if (existing) {
      return jsonOk({ counted: false, viewCount: post.viewCount });
    }

    await prisma.$transaction([
      prisma.analyticsEvent.create({
        data: {
          name: "post.view",
          entityType: "Post",
          entityId: post.id,
          userId: user?.id,
          eventKey,
        },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      }),
    ]);

    return jsonOk({ counted: true, viewCount: post.viewCount + 1 });
  } catch (error) {
    return handleApiError(error);
  }
}
