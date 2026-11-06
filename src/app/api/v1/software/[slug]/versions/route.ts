import { prisma } from "@/lib/db";
import { ApiError, handleApiError, jsonOk } from "@/lib/api";
import { publicSoftwareWhere } from "@/lib/api/serializers";

type Params = { params: Promise<{ slug: string }> };

async function findPublicSoftware(idOrSlug: string) {
  return prisma.software.findFirst({
    where: {
      ...publicSoftwareWhere,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug: idOrSlug } = await params;
    const software = await findPublicSoftware(idOrSlug);
    if (!software) throw new ApiError(404, "NOT_FOUND", "Software not found");

    const versions = await prisma.softwareVersion.findMany({
      where: { softwareId: software.id },
      orderBy: [{ isLatest: "desc" }, { releaseDate: "desc" }],
      include: {
        files: {
          where: { verificationStatus: "VERIFIED" },
          select: {
            id: true,
            originalName: true,
            extension: true,
            mimeType: true,
            sizeBytes: true,
            checksumSha256: true,
            verificationStatus: true,
          },
        },
      },
    });

    return jsonOk({
      softwareId: software.id,
      items: versions.map((v) => ({
        id: v.id,
        version: v.version,
        versionCode: v.versionCode,
        changelog: v.changelog,
        releaseDate: v.releaseDate,
        isLatest: v.isLatest,
        files: v.files.map((f) => ({
          ...f,
          sizeBytes: Number(f.sizeBytes),
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
