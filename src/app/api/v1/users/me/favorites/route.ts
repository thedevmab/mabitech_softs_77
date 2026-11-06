import { prisma } from "@/lib/db";
import { getPagination, handleApiError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";
import { publicSoftwareWhere, serializeSoftware } from "@/lib/api/serializers";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPagination(searchParams);

    const where = {
      userId: user.id,
      software: publicSoftwareWhere,
    };
    const [total, rows] = await Promise.all([
      prisma.favorite.count({ where }),
      prisma.favorite.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          software: {
            include: {
              category: true,
              versions: { where: { isLatest: true }, take: 1 },
            },
          },
        },
      }),
    ]);

    return jsonOk({
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        software: serializeSoftware(row.software),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
