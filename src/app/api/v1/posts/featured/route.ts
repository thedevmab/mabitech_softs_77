import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { postApiInclude, publicPostWhere, serializePost } from "@/lib/api/serializers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10) || 10));

    const posts = await prisma.post.findMany({
      where: { ...publicPostWhere(), isFeatured: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: postApiInclude,
    });

    return jsonOk({
      items: posts.map((p) => serializePost(p, { includeContent: false })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
