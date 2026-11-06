import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonCreated,
  jsonError,
  parseJson,
} from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";
import { publicPostWhere, serializeComment } from "@/lib/api/serializers";

type Params = { params: Promise<{ slug: string }> };

const schema = z.object({
  body: z.string().trim().min(1).max(5000),
  parentId: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const ip = getClientIp(request);
    const rl = await rateLimit(`comments:${user.id}:${ip}`, 20, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many comments");
    }

    const { slug: idOrSlug } = await params;
    const body = await parseJson(request, schema);

    const post = await prisma.post.findFirst({
      where: {
        ...publicPostWhere(),
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!post) throw new ApiError(404, "NOT_FOUND", "Post not found");

    if (body.parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: body.parentId, postId: post.id, status: "VISIBLE" },
      });
      if (!parent) throw new ApiError(400, "INVALID_PARENT", "Parent comment not found");
    }

    const comment = await prisma.comment.create({
      data: {
        body: body.body,
        postId: post.id,
        userId: user.id,
        parentId: body.parentId,
        status: "VISIBLE",
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return jsonCreated(serializeComment(comment));
  } catch (error) {
    return handleApiError(error);
  }
}
