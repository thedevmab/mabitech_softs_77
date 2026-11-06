import { prisma } from "@/lib/db";
import { ApiError, handleApiError, jsonOk } from "@/lib/api";
import { publicSoftwareWhere, serializeSoftware } from "@/lib/api/serializers";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const installedVersionCodeRaw = searchParams.get("installedVersionCode");
    const installedVersionCode =
      installedVersionCodeRaw != null && installedVersionCodeRaw !== ""
        ? Number(installedVersionCodeRaw)
        : null;

    const software = await prisma.software.findFirst({
      where: {
        ...publicSoftwareWhere,
        OR: [{ slug }, { id: slug }],
      },
      include: {
        category: true,
        versions: { orderBy: { releaseDate: "desc" } },
        files: {
          where: { verificationStatus: "VERIFIED" },
          orderBy: { createdAt: "desc" },
        },
        affiliateCampaign: true,
        _count: { select: { favorites: true, reviews: true } },
      },
    });

    if (!software) throw new ApiError(404, "NOT_FOUND", "Software not found");

    const avg = await prisma.review.aggregate({
      where: { softwareId: software.id },
      _avg: { rating: true },
    });

    await prisma.software.update({
      where: { id: software.id },
      data: { viewCount: { increment: 1 } },
    });

    return jsonOk(
      serializeSoftware(
        { ...software, avgRating: avg._avg.rating },
        {
          installedVersionCode: Number.isFinite(installedVersionCode)
            ? installedVersionCode
            : null,
        },
      ),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
