import { prisma } from "@/lib/db";
import { getPagination, handleApiError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPagination(searchParams);

    const where = { userId: user.id, type: "INITIATED" as const };
    const [total, rows] = await Promise.all([
      prisma.downloadEvent.count({ where }),
      prisma.downloadEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          software: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconUrl: true,
              channel: true,
            },
          },
          file: {
            select: {
              id: true,
              originalName: true,
              extension: true,
              sizeBytes: true,
            },
          },
        },
      }),
    ]);

    return jsonOk({
      items: rows.map((row) => ({
        id: row.id,
        type: row.type,
        createdAt: row.createdAt,
        software: row.software,
        file: row.file
          ? {
              id: row.file.id,
              originalName: row.file.originalName,
              extension: row.file.extension,
              sizeBytes: Number(row.file.sizeBytes),
            }
          : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
