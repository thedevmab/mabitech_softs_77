import { prisma } from "@/lib/db";
import { getPagination, handleApiError, jsonOk, publicCacheHeaders } from "@/lib/api";
import { publicSoftwareWhere, serializeSoftware } from "@/lib/api/serializers";

const AI_CATEGORY_SLUGS = ["ai-tools", "artificial-intelligence"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPagination(searchParams);
    const q = searchParams.get("q")?.trim();
    const featured = searchParams.get("featured");

    const where = {
      AND: [
        publicSoftwareWhere,
        {
          category: { slug: { in: AI_CATEGORY_SLUGS } },
        },
        ...(featured === "true" ? [{ isFeatured: true }] : []),
        ...(q
          ? [
              {
                OR: [
                  { name: { contains: q, mode: "insensitive" as const } },
                  { shortDescription: { contains: q, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const [total, items] = await Promise.all([
      prisma.software.count({ where }),
      prisma.software.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          category: true,
          versions: { where: { isLatest: true }, take: 1 },
          files: { take: 3, orderBy: { createdAt: "desc" } },
          affiliateCampaign: {
            select: { disclosure: true, destinationUrl: true, isActive: true },
          },
          _count: { select: { favorites: true, reviews: true } },
        },
      }),
    ]);

    return jsonOk(
      {
        items: items.map((s) => serializeSoftware(s)),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      { headers: publicCacheHeaders(60) },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
