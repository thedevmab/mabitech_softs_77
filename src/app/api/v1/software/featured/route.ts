import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { publicSoftwareWhere, serializeSoftware } from "@/lib/api/serializers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10) || 10));

    const items = await prisma.software.findMany({
      where: { ...publicSoftwareWhere, isFeatured: true },
      orderBy: [{ downloadCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        category: true,
        versions: { where: { isLatest: true }, take: 1 },
        _count: { select: { favorites: true, reviews: true } },
      },
    });

    return jsonOk({ items: items.map((s) => serializeSoftware(s)) });
  } catch (error) {
    return handleApiError(error);
  }
}
