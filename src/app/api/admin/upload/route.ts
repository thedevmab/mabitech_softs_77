import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/request-user";
import { requirePermission, userIsStaff } from "@/lib/auth/rbac";
import { storeSoftwareFile } from "@/lib/storage/files";
import { prisma } from "@/lib/db";
import { handleApiError, jsonCreated, jsonError, ApiError } from "@/lib/api";
import { logActivity } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    if (!(await userIsStaff(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "Staff access required");
    }
    await requirePermission(user.id, "software.edit");

    const form = await request.formData();
    const softwareId = String(form.get("softwareId") || "");
    const versionId = form.get("versionId") ? String(form.get("versionId")) : undefined;
    const file = form.get("file");

    if (!softwareId || !(file instanceof File)) {
      return jsonError(400, "INVALID_FORM", "softwareId and file are required");
    }

    const software = await prisma.software.findFirst({
      where: { id: softwareId, deletedAt: null },
    });
    if (!software) throw new ApiError(404, "NOT_FOUND", "Software not found");

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeSoftwareFile({
      buffer,
      filename: file.name,
      softwareId,
      versionId,
      declaredMime: file.type || undefined,
    });

    // Never auto-verify uploaded hosted files
    if (stored.verificationStatus === "VERIFIED") {
      await prisma.softwareFile.update({
        where: { id: stored.id },
        data: { verificationStatus: "PENDING_REVIEW" },
      });
    }

    await prisma.software.update({
      where: { id: softwareId },
      data: {
        verificationStatus:
          software.verificationStatus === "VERIFIED"
            ? "PENDING_REVIEW"
            : software.verificationStatus,
      },
    });

    await logActivity({
      userId: user.id,
      action: "software.file.upload",
      entityType: "SoftwareFile",
      entityId: stored.id,
      metadata: { softwareId, originalName: stored.originalName },
    });

    return jsonCreated({
      id: stored.id,
      originalName: stored.originalName,
      extension: stored.extension,
      sizeBytes: stored.sizeBytes.toString(),
      verificationStatus: "PENDING_REVIEW",
      checksumSha256: stored.checksumSha256,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
