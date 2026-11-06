import { createHash, randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { ApiError } from "@/lib/api";
import { uploadObject, deleteObject, getPresignedDownloadUrl } from "@/lib/storage/s3";
import { scanBuffer } from "@/lib/storage/clamav";
import { readApkMetadata } from "@/lib/storage/apk";
import { prisma } from "@/lib/db";
import { randomToken, hashToken } from "@/lib/utils";
import { POST_FILE_EXTENSIONS, sanitizeDownloadFilename } from "@/lib/posts/delivery";

const EXTENSION_MIME: Record<string, string[]> = {
  apk: [
    "application/vnd.android.package-archive",
    "application/zip",
    "application/java-archive",
    "application/octet-stream",
  ],
  aab: ["application/octet-stream", "application/zip"],
  exe: ["application/x-msdownload", "application/x-dosexec", "application/octet-stream"],
  msi: ["application/x-msi", "application/octet-stream"],
  zip: ["application/zip", "application/x-zip-compressed"],
  rar: ["application/vnd.rar", "application/x-rar-compressed", "application/octet-stream"],
  "7z": ["application/x-7z-compressed", "application/octet-stream"],
  pdf: ["application/pdf"],
  doc: ["application/msword", "application/octet-stream"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/octet-stream",
  ],
  xls: ["application/vnd.ms-excel", "application/octet-stream"],
  xlsx: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/octet-stream",
  ],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/octet-stream",
  ],
  txt: ["text/plain", "application/octet-stream"],
  csv: ["text/csv", "text/plain", "application/csv", "application/octet-stream"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  gif: ["image/gif"],
};

const MAGIC_ALLOW: Record<string, Array<(buf: Buffer) => boolean>> = {
  zip: [(b) => b[0] === 0x50 && b[1] === 0x4b],
  apk: [(b) => b[0] === 0x50 && b[1] === 0x4b],
  aab: [(b) => b[0] === 0x50 && b[1] === 0x4b],
  pdf: [(b) => b.slice(0, 4).toString() === "%PDF"],
  rar: [(b) => b.slice(0, 4).toString() === "Rar!" || (b[0] === 0x52 && b[1] === 0x61)],
  "7z": [(b) => b[0] === 0x37 && b[1] === 0x7a],
  exe: [(b) => b[0] === 0x4d && b[1] === 0x5a],
  msi: [(b) => b[0] === 0xd0 && b[1] === 0xcf],
  // OLE Compound Document (legacy Office)
  doc: [(b) => b[0] === 0xd0 && b[1] === 0xcf],
  xls: [(b) => b[0] === 0xd0 && b[1] === 0xcf],
  // OOXML is ZIP-based
  docx: [(b) => b[0] === 0x50 && b[1] === 0x4b],
  xlsx: [(b) => b[0] === 0x50 && b[1] === 0x4b],
  pptx: [(b) => b[0] === 0x50 && b[1] === 0x4b],
  jpg: [(b) => b[0] === 0xff && b[1] === 0xd8],
  jpeg: [(b) => b[0] === 0xff && b[1] === 0xd8],
  png: [(b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47],
  gif: [(b) => b.slice(0, 3).toString() === "GIF"],
  webp: [(b) => b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP"],
};

export function getExtension(filename: string) {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop()! : "";
}

export async function validateUpload(params: {
  buffer: Buffer;
  filename: string;
  declaredMime?: string;
  maxBytes?: number;
  allowedExtensions?: string[];
}) {
  const ext = getExtension(params.filename);
  const allowed = params.allowedExtensions || Object.keys(EXTENSION_MIME);
  if (!allowed.includes(ext)) {
    throw new ApiError(400, "FILE_TYPE_DENIED", `File type .${ext} is not allowed`);
  }

  const maxBytes = params.maxBytes || Number(process.env.MAX_UPLOAD_BYTES || 524288000);
  if (params.buffer.byteLength > maxBytes) {
    throw new ApiError(400, "FILE_TOO_LARGE", "File exceeds the maximum upload size");
  }

  let detected: { mime: string } | undefined;
  try {
    detected = (await fileTypeFromBuffer(params.buffer)) || undefined;
  } catch {
    // Truncated fixtures or exotic containers may throw; magic checks below still apply.
    detected = undefined;
  }
  const allowedMimes = EXTENSION_MIME[ext] || [];
  if (
    detected?.mime &&
    !allowedMimes.includes(detected.mime) &&
    !allowedMimes.includes("application/octet-stream")
  ) {
    throw new ApiError(400, "MIME_MISMATCH", "File content does not match the declared type");
  }

  const magicChecks = MAGIC_ALLOW[ext];
  if (magicChecks && !magicChecks.some((fn) => fn(params.buffer))) {
    throw new ApiError(400, "MAGIC_MISMATCH", "File signature validation failed");
  }

  // Text-like formats without a reliable magic signature
  if ((ext === "txt" || ext === "csv") && params.buffer.includes(0)) {
    throw new ApiError(400, "MAGIC_MISMATCH", "Text file contains binary data");
  }

  const checksumSha256 = createHash("sha256").update(params.buffer).digest("hex");
  return {
    ext,
    mimeType: detected?.mime || params.declaredMime || allowedMimes[0] || "application/octet-stream",
    checksumSha256,
    sizeBytes: params.buffer.byteLength,
  };
}

export async function storeSoftwareFile(params: {
  buffer: Buffer;
  filename: string;
  softwareId: string;
  versionId?: string;
  declaredMime?: string;
}) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  const validated = await validateUpload({
    buffer: params.buffer,
    filename: params.filename,
    declaredMime: params.declaredMime,
    maxBytes: settings ? Number(settings.maxUploadBytes) : undefined,
    allowedExtensions: settings?.uploadAllowedTypes?.length
      ? settings.uploadAllowedTypes
      : undefined,
  });

  const scan = await scanBuffer(params.buffer);
  if (scan.infected) {
    throw new ApiError(400, "MALWARE_DETECTED", "Uploaded file failed malware scanning");
  }

  const key = `software/${params.softwareId}/${Date.now()}-${validated.checksumSha256.slice(0, 12)}.${validated.ext}`;
  const stored = await uploadObject({
    key,
    body: params.buffer,
    contentType: validated.mimeType,
  });

  const file = await prisma.softwareFile.create({
    data: {
      softwareId: params.softwareId,
      versionId: params.versionId,
      fileName: key.split("/").pop()!,
      originalName: params.filename,
      mimeType: validated.mimeType,
      extension: validated.ext,
      sizeBytes: BigInt(validated.sizeBytes),
      checksumSha256: validated.checksumSha256,
      storageKey: stored.key,
      storageBucket: stored.bucket,
      verificationStatus: scan.skipped ? "PENDING_REVIEW" : "PENDING_REVIEW",
      scanResult: scan.result,
      scannedAt: scan.skipped ? null : new Date(),
    },
  });

  return file;
}

export async function removeSoftwareFile(fileId: string) {
  const file = await prisma.softwareFile.findUnique({ where: { id: fileId } });
  if (!file) return;
  await deleteObject(file.storageKey, file.storageBucket);
  await prisma.softwareFile.delete({ where: { id: fileId } });
}

export async function storePostFile(params: {
  buffer: Buffer;
  filename: string;
  uploadedById?: string;
  declaredMime?: string;
}) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  const siteAllowed = settings?.uploadAllowedTypes?.length
    ? settings.uploadAllowedTypes.map((t) => t.toLowerCase())
    : null;
  const allowedExtensions = siteAllowed
    ? POST_FILE_EXTENSIONS.filter((ext) => siteAllowed.includes(ext))
    : [...POST_FILE_EXTENSIONS];

  if (allowedExtensions.length === 0) {
    throw new ApiError(400, "FILE_TYPE_DENIED", "No post file types are configured");
  }

  const validated = await validateUpload({
    buffer: params.buffer,
    filename: params.filename,
    declaredMime: params.declaredMime,
    maxBytes: settings ? Number(settings.maxUploadBytes) : undefined,
    allowedExtensions,
  });

  const scan = await scanBuffer(params.buffer);
  if (scan.infected) {
    throw new ApiError(400, "MALWARE_DETECTED", "Uploaded file failed malware scanning");
  }

  let apkMeta = {
    packageName: null as string | null,
    versionName: null as string | null,
    versionCode: null as number | null,
    minSdkVersion: null as number | null,
  };
  if (validated.ext === "apk") {
    apkMeta = await readApkMetadata(params.buffer);
  }

  const safeOriginal = sanitizeDownloadFilename(params.filename);
  const key = `posts/${randomUUID()}-${validated.checksumSha256.slice(0, 12)}.${validated.ext}`;
  const stored = await uploadObject({
    key,
    body: params.buffer,
    contentType: validated.mimeType,
  });

  const file = await prisma.postFile.create({
    data: {
      originalName: safeOriginal,
      fileName: key.split("/").pop()!,
      extension: validated.ext,
      mimeType: validated.mimeType,
      sizeBytes: BigInt(validated.sizeBytes),
      checksumSha256: validated.checksumSha256,
      storageKey: stored.key,
      storageBucket: stored.bucket,
      scanResult: scan.result,
      scannedAt: scan.skipped ? null : new Date(),
      apkPackage: apkMeta.packageName,
      apkVersionName: apkMeta.versionName,
      apkVersionCode: apkMeta.versionCode,
      apkMinSdk: apkMeta.minSdkVersion,
      uploadedById: params.uploadedById,
    },
  });

  return { file, scanSkipped: scan.skipped };
}

export async function removePostFile(fileId: string) {
  const file = await prisma.postFile.findUnique({
    where: { id: fileId },
    include: { post: { select: { id: true, status: true } } },
  });
  if (!file) return;

  if (file.post && file.post.status === "PUBLISHED") {
    throw new ApiError(
      400,
      "FILE_IN_USE",
      "Detach or unpublish the post before deleting this file",
    );
  }

  if (file.post) {
    await prisma.post.update({
      where: { id: file.post.id },
      data: { fileId: null, deliveryType: "NONE" },
    });
  }

  await deleteObject(file.storageKey, file.storageBucket);
  await prisma.postFile.delete({ where: { id: fileId } });
}

export async function createDownloadGrant(params: {
  softwareId: string;
  fileId: string;
  userId?: string;
  ttlSeconds?: number;
}) {
  const raw = randomToken(32);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + (params.ttlSeconds || 120) * 1000);
  await prisma.downloadGrant.create({
    data: {
      tokenHash,
      softwareId: params.softwareId,
      fileId: params.fileId,
      userId: params.userId,
      expiresAt,
    },
  });
  return { token: raw, expiresAt };
}

export async function redeemDownloadGrant(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const grant = await prisma.downloadGrant.findUnique({
    where: { tokenHash },
    include: { file: true, software: true },
  });
  if (!grant || grant.usedAt || grant.expiresAt < new Date()) {
    throw new ApiError(400, "INVALID_GRANT", "Download link is invalid or expired");
  }
  await prisma.downloadGrant.update({
    where: { id: grant.id },
    data: { usedAt: new Date() },
  });
  const url = await getPresignedDownloadUrl(
    grant.file.storageKey,
    120,
    grant.file.originalName,
  );
  return { url, grant };
}

export async function createPostFileDownloadUrl(params: {
  storageKey: string;
  originalName: string;
  ttlSeconds?: number;
}) {
  return getPresignedDownloadUrl(
    params.storageKey,
    params.ttlSeconds || 120,
    sanitizeDownloadFilename(params.originalName),
  );
}
