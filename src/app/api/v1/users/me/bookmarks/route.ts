import { prisma } from "@/lib/db";
import { getPagination, handleApiError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";
import { publicPostWhere, serializePost } from "@/lib/api/serializers";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPagination(searchParams);

    const where = {
      userId: user.id,
      post: publicPostWhere(),
    };
    const [total, rows] = await Promise.all([
      prisma.bookmark.count({ where }),
      prisma.bookmark.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          post: {
            include: {
              author: { select: { id: true, name: true, image: true } },
              categories: { include: { category: true } },
              tags: { include: { tag: true } },
              file: true,
            },
          },
        },
      }),
    ]);

    return jsonOk({
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        post: serializePost(row.post, { includeContent: false }),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
