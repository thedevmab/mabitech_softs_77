import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/request-user";
import { requirePermission, userIsStaff } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { handleApiError, jsonCreated, jsonError, ApiError } from "@/lib/api";
import { isCloudinaryConfigured, uploadImage } from "@/lib/storage/cloudinary";
import { validateUpload, getExtension } from "@/lib/storage/files";
import { uploadObject } from "@/lib/storage/s3";
import { absoluteUrl } from "@/lib/utils";
import { logActivity } from "@/lib/audit";
import { IMAGE_EXTENSIONS } from "@/lib/posts/delivery";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    if (!(await userIsStaff(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "Staff access required");
    }
    await requirePermission(user.id, "posts.edit");

    const form = await request.formData();
    const file = form.get("file");
    const alt = form.get("alt") ? String(form.get("alt")) : undefined;
    if (!(file instanceof File)) {
      return jsonError(400, "INVALID_FORM", "file is required");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = getExtension(file.name);
    if (!(IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
      return jsonError(400, "FILE_TYPE_DENIED", "Only image files are allowed");
    }

    const validated = await validateUpload({
      buffer,
      filename: file.name,
      declaredMime: file.type || undefined,
      maxBytes: MAX_IMAGE_BYTES,
      allowedExtensions: [...IMAGE_EXTENSIONS],
    });

    let url: string;
    let publicId: string | null = null;
    let width: number | null = null;
    let height: number | null = null;

    if (isCloudinaryConfigured()) {
      const uploaded = await uploadImage(buffer, "daily-tips/posts");
      url = uploaded.secure_url;
      publicId = uploaded.public_id;
      width = uploaded.width;
      height = uploaded.height;
    } else {
      const key = `media/posts/${randomUUID()}-${validated.checksumSha256.slice(0, 12)}.${validated.ext}`;
      await uploadObject({
        key,
        body: buffer,
        contentType: validated.mimeType,
      });
      url = absoluteUrl(`/api/v1/media/${key}`);
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        url,
        publicId,
        type: "IMAGE",
        mimeType: validated.mimeType,
        width: width ?? undefined,
        height: height ?? undefined,
        sizeBytes: validated.sizeBytes,
        alt,
        uploadedById: user.id,
      },
    });

    await logActivity({
      userId: user.id,
      action: "posts.image.upload",
      entityType: "MediaAsset",
      entityId: asset.id,
    });

    return jsonCreated({
      id: asset.id,
      url: asset.url,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      width: asset.width,
      height: asset.height,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
