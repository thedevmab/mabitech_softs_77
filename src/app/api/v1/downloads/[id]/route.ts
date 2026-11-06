import { prisma } from "@/lib/db";
import { ApiError, handleApiError, jsonOk, publicCacheHeaders } from "@/lib/api";
import { publicSoftwareWhere, serializeSoftware } from "@/lib/api/serializers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (id === "local" || id === "complete") {
      throw new ApiError(404, "NOT_FOUND", "Not found");
    }

    const software = await prisma.software.findFirst({
      where: {
        ...publicSoftwareWhere,
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        versions: { orderBy: { createdAt: "desc" } },
        files: { orderBy: { createdAt: "desc" } },
        affiliateCampaign: {
          select: { disclosure: true, destinationUrl: true, isActive: true },
        },
        _count: { select: { favorites: true, reviews: true } },
      },
    });
    if (!software) throw new ApiError(404, "NOT_FOUND", "Download not found");

    return jsonOk(serializeSoftware(software), { headers: publicCacheHeaders(60) });
  } catch (error) {
    return handleApiError(error);
  }
}
