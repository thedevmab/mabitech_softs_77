import { z } from "zod";
import { PostDeliveryType } from "@prisma/client";
import { ApiError } from "@/lib/api";

export const POST_FILE_EXTENSIONS = [
  "apk",
  "aab",
  "zip",
  "rar",
  "7z",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "pptx",
  "txt",
  "csv",
] as const;

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;

const deliveryTypeSchema = z.enum(["NONE", "FILE", "LINK"]);

export function parseDeliveryType(raw: string): PostDeliveryType {
  const parsed = deliveryTypeSchema.safeParse(raw.toUpperCase());
  if (!parsed.success) return PostDeliveryType.NONE;
  return parsed.data as PostDeliveryType;
}

/**
 * Validate external download/website URLs.
 * - Rejects javascript:, data:, and credential-bearing URLs
 * - Requires https in production; http allowed in non-production
 */
export function validateExternalUrl(raw: string): string {
  const value = raw.trim();
  if (!value) {
    throw new ApiError(400, "VALIDATION", "External URL is required for link posts");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError(400, "VALIDATION", "External URL is invalid");
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== "https:" && protocol !== "http:") {
    throw new ApiError(400, "VALIDATION", "Only http(s) URLs are allowed");
  }

  if (process.env.NODE_ENV === "production" && protocol !== "https:") {
    throw new ApiError(400, "VALIDATION", "External URLs must use HTTPS in production");
  }

  if (url.username || url.password) {
    throw new ApiError(400, "VALIDATION", "URLs with credentials are not allowed");
  }

  if (!url.hostname) {
    throw new ApiError(400, "VALIDATION", "External URL must include a hostname");
  }

  return url.toString();
}

export function sanitizeDownloadFilename(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, " ").trim();
  const cleaned = base.slice(0, 180) || "download";
  return cleaned.replace(/"/g, "");
}
