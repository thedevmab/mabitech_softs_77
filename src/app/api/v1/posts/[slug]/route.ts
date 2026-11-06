import { prisma } from "@/lib/db";
import { ApiError, getPagination, handleApiError, jsonOk } from "@/lib/api";
import {
  postApiInclude,
  publicPostWhere,
  serializeComment,
  serializePost,
} from "@/lib/api/serializers";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const includeComments = searchParams.get("comments") === "true";
    const { page, limit, skip } = getPagination(searchParams);

    const post = await prisma.post.findFirst({
      where: {
        ...publicPostWhere(),
        OR: [{ slug }, { id: slug }],
      },
      include: postApiInclude,
    });

    if (!post) throw new ApiError(404, "NOT_FOUND", "Post not found");

    let comments: unknown[] | undefined;
    let commentsPagination: unknown | undefined;
    if (includeComments) {
      const where = {
        postId: post.id,
        status: "VISIBLE" as const,
        parentId: null,
      };
      const [total, rows] = await Promise.all([
        prisma.comment.count({ where }),
        prisma.comment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            user: { select: { id: true, name: true, image: true } },
            replies: {
              where: { status: "VISIBLE" },
              take: 5,
              orderBy: { createdAt: "asc" },
              include: { user: { select: { id: true, name: true, image: true } } },
            },
          },
        }),
      ]);
      comments = rows.map((c) => ({
        ...serializeComment(c),
        replies: c.replies.map(serializeComment),
      }));
      commentsPagination = { page, limit, total, totalPages: Math.ceil(total / limit) };
    }

    return jsonOk({
      ...serializePost(post),
      comments,
      commentsPagination,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
