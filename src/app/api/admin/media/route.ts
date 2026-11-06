import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/request-user";
import { requirePermission, userIsStaff } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { handleApiError, jsonCreated, jsonError, ApiError, parseJson } from "@/lib/api";
import { isCloudinaryConfigured, uploadImage } from "@/lib/storage/cloudinary";
import { logActivity } from "@/lib/audit";

export const runtime = "nodejs";

const urlSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  type: z.enum(["IMAGE", "VIDEO", "DOCUMENT", "OTHER"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    if (!(await userIsStaff(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "Staff access required");
    }
    await requirePermission(user.id, "media.manage");

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      if (!isCloudinaryConfigured()) {
        return jsonError(
          400,
          "CLOUDINARY_NOT_CONFIGURED",
          "Cloudinary is not configured. Send JSON { url } instead.",
        );
      }
      const form = await request.formData();
      const file = form.get("file");
      const alt = form.get("alt") ? String(form.get("alt")) : undefined;
      if (!(file instanceof File)) {
        return jsonError(400, "INVALID_FORM", "file is required");
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadImage(buffer);
      const asset = await prisma.mediaAsset.create({
        data: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          type: "IMAGE",
          mimeType: file.type || `image/${uploaded.format}`,
          width: uploaded.width,
          height: uploaded.height,
          sizeBytes: uploaded.bytes,
          alt,
          uploadedById: user.id,
        },
      });
      await logActivity({
        userId: user.id,
        action: "media.upload",
        entityType: "MediaAsset",
        entityId: asset.id,
      });
      return jsonCreated(asset);
    }

    const body = await parseJson(request, urlSchema);
    const asset = await prisma.mediaAsset.create({
      data: {
        url: body.url,
        type: body.type || "IMAGE",
        alt: body.alt,
        uploadedById: user.id,
      },
    });
    await logActivity({
      userId: user.id,
      action: "media.save_url",
      entityType: "MediaAsset",
      entityId: asset.id,
    });
    return jsonCreated(asset);
  } catch (error) {
    return handleApiError(error);
  }
}
