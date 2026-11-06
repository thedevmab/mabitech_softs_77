import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/request-user";
import { requirePermission, userIsStaff } from "@/lib/auth/rbac";
import { storePostFile } from "@/lib/storage/files";
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
    await requirePermission(user.id, "posts.edit");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError(400, "INVALID_FORM", "file is required");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { file: stored, scanSkipped } = await storePostFile({
      buffer,
      filename: file.name,
      uploadedById: user.id,
      declaredMime: file.type || undefined,
    });

    await logActivity({
      userId: user.id,
      action: "posts.file.upload",
      entityType: "PostFile",
      entityId: stored.id,
      metadata: { originalName: stored.originalName, extension: stored.extension },
    });

    return jsonCreated({
      id: stored.id,
      originalName: stored.originalName,
      fileName: stored.fileName,
      extension: stored.extension,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes.toString(),
      checksumSha256: stored.checksumSha256,
      scanResult: stored.scanResult,
      scanSkipped,
      isApk: stored.extension === "apk",
      apk: stored.extension === "apk"
        ? {
            packageName: stored.apkPackage,
            versionName: stored.apkVersionName,
            versionCode: stored.apkVersionCode,
            minSdkVersion: stored.apkMinSdk,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
