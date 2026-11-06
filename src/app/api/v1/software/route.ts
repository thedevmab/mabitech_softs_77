import { prisma } from "@/lib/db";
import { getPagination, handleApiError, jsonOk, publicCacheHeaders } from "@/lib/api";
import { publicSoftwareWhere, serializeSoftware } from "@/lib/api/serializers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPagination(searchParams);
    const category = searchParams.get("category") || undefined;
    const channel = searchParams.get("channel") || undefined;
    const q = searchParams.get("q")?.trim();
    const featured = searchParams.get("featured");
    const premium = searchParams.get("premium");

    const where = {
      AND: [
        publicSoftwareWhere,
        ...(featured === "true" ? [{ isFeatured: true }] : []),
        ...(premium === "true" ? [{ isPremium: true }] : []),
        ...(premium === "false" ? [{ isPremium: false }] : []),
        ...(category ? [{ category: { slug: category } }] : []),
        ...(channel === "HOSTED_FILE" ||
        channel === "EXTERNAL_URL" ||
        channel === "GOOGLE_PLAY"
          ? [{ channel: channel as "HOSTED_FILE" | "EXTERNAL_URL" | "GOOGLE_PLAY" }]
          : []),
        ...(q
          ? [
              {
                OR: [
                  { name: { contains: q, mode: "insensitive" as const } },
                  {
                    shortDescription: {
                      contains: q,
                      mode: "insensitive" as const,
                    },
                  },
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
