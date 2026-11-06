import { prisma } from "@/lib/db";
import { getPagination, handleApiError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPagination(searchParams);
    const now = new Date();

    const where = {
      isActive: true,
      startAt: { lte: now },
      endAt: { gte: now },
    };

    const [total, rows] = await Promise.all([
      prisma.sponsoredCampaign.count({ where }),
      prisma.sponsoredCampaign.findMany({
        where,
        orderBy: { startAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return jsonOk({
      items: rows.map((row) => ({
        id: row.id,
        sponsorName: row.sponsorName,
        title: row.title,
        description: row.description,
        bannerUrl: row.bannerUrl,
        destinationUrl: row.destinationUrl,
        startAt: row.startAt,
        endAt: row.endAt,
        labeled: true as const,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
