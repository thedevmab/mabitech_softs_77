import { prisma } from "@/lib/db";
import { ApiError, handleApiError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";
import { publicSoftwareWhere } from "@/lib/api/serializers";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { slug: idOrSlug } = await params;

    const software = await prisma.software.findFirst({
      where: {
        ...publicSoftwareWhere,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!software) throw new ApiError(404, "NOT_FOUND", "Software not found");

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_softwareId: { userId: user.id, softwareId: software.id },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return jsonOk({ favorited: false, softwareId: software.id });
    }

    await prisma.favorite.create({
      data: { userId: user.id, softwareId: software.id },
    });
    return jsonOk({ favorited: true, softwareId: software.id });
  } catch (error) {
    return handleApiError(error);
  }
}
