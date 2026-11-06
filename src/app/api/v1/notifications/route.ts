import { prisma } from "@/lib/db";
import { getPagination, handleApiError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPagination(searchParams);
    const unreadOnly = searchParams.get("unread") === "true";

    const where = {
      userId: user.id,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.notificationReceipt.count({ where }),
      prisma.notificationReceipt.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          notification: true,
        },
      }),
    ]);

    return jsonOk({
      items: rows.map((r) => ({
        id: r.id,
        readAt: r.readAt,
        createdAt: r.createdAt,
        notification: {
          id: r.notification.id,
          title: r.notification.title,
          body: r.notification.body,
          imageUrl: r.notification.imageUrl,
          data: r.notification.data,
          sentAt: r.notification.sentAt,
        },
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
