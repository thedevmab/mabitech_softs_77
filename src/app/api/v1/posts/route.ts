import { prisma } from "@/lib/db";
import { getPagination, handleApiError, jsonOk, publicCacheHeaders } from "@/lib/api";
import { postApiInclude, publicPostWhere, serializePost } from "@/lib/api/serializers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPagination(searchParams);
    const category = searchParams.get("category") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const q = searchParams.get("q")?.trim();
    const featured = searchParams.get("featured");

    const where = {
      AND: [
        publicPostWhere(),
        ...(featured === "true" ? [{ isFeatured: true }] : []),
        ...(category
          ? [{ categories: { some: { category: { slug: category } } } }]
          : []),
        ...(tag ? [{ tags: { some: { tag: { slug: tag } } } }] : []),
        ...(q
          ? [
              {
                OR: [
                  { title: { contains: q, mode: "insensitive" as const } },
                  { excerpt: { contains: q, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: postApiInclude,
      }),
    ]);

    return jsonOk(
      {
        items: posts.map((p) => serializePost(p, { includeContent: false })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      { headers: publicCacheHeaders(60) },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
