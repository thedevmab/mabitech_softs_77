"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DistributionChannel,
  SoftwareStatus,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { makeSlug } from "@/lib/utils";
import { sanitizeContent } from "@/lib/admin/sanitize";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";
import { ApiError } from "@/lib/api";

function parseList(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formSoftwareData(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const shortDescription = String(formData.get("shortDescription") || "").trim() || null;
  const description = sanitizeContent(String(formData.get("description") || ""));
  const iconUrl = String(formData.get("iconUrl") || "").trim() || null;
  const coverUrl = String(formData.get("coverUrl") || "").trim() || null;
  const developerName = String(formData.get("developerName") || "").trim() || null;
  const officialWebsite = String(formData.get("officialWebsite") || "").trim() || null;
  const categoryId = String(formData.get("categoryId") || "").trim() || null;
  const supportedOs = parseList(String(formData.get("supportedOs") || ""));
  const minAndroidVersion = String(formData.get("minAndroidVersion") || "").trim() || null;
  const channelRaw = String(formData.get("channel") || "HOSTED_FILE");
  const channel = (Object.values(DistributionChannel) as string[]).includes(channelRaw)
    ? (channelRaw as DistributionChannel)
    : DistributionChannel.HOSTED_FILE;
  const externalUrl = String(formData.get("externalUrl") || "").trim() || null;
  const googlePlayUrl = String(formData.get("googlePlayUrl") || "").trim() || null;
  const isFree = formData.get("isFree") === "on";
  const isPremium = formData.get("isPremium") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const statusRaw = String(formData.get("status") || "DRAFT");
  const status = (Object.values(SoftwareStatus) as string[]).includes(statusRaw)
    ? (statusRaw as SoftwareStatus)
    : SoftwareStatus.DRAFT;
  const screenshots = parseList(String(formData.get("screenshots") || ""));
  const affiliateCampaignId =
    String(formData.get("affiliateCampaignId") || "").trim() || null;

  if (!name) throw new ApiError(400, "VALIDATION", "Name is required");
  if (!description.trim()) throw new ApiError(400, "VALIDATION", "Description is required");

  return {
    name,
    slug: makeSlug(slugInput || name),
    shortDescription,
    description,
    iconUrl,
    coverUrl,
    developerName,
    officialWebsite,
    categoryId,
    supportedOs,
    minAndroidVersion,
    channel,
    externalUrl,
    googlePlayUrl,
    isFree,
    isPremium,
    isFeatured,
    status,
    screenshots,
    affiliateCampaignId,
  };
}

export async function createSoftwareAction(formData: FormData) {
  const user = await getAdminActionUser("software.create");
  const data = formSoftwareData(formData);

  if (data.status === "PUBLISHED") {
    await getAdminActionUser("software.publish");
  }

  let slug = data.slug;
  if (await prisma.software.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const software = await prisma.software.create({
    data: {
      ...data,
      slug,
      verificationStatus: VerificationStatus.UNVERIFIED,
    },
  });

  await logActivity({
    userId: user.id,
    action: "software.create",
    entityType: "Software",
    entityId: software.id,
  });

  revalidatePath("/admin/software");
  redirect(`/admin/software/${software.id}`);
}

export async function updateSoftwareAction(softwareId: string, formData: FormData) {
  const user = await getAdminActionUser("software.edit");
  const data = formSoftwareData(formData);

  const existing = await prisma.software.findFirst({
    where: { id: softwareId, deletedAt: null },
  });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Software not found");

  if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    await getAdminActionUser("software.publish");
  }

  let slug = data.slug;
  const clash = await prisma.software.findFirst({
    where: { slug, NOT: { id: softwareId } },
  });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  await prisma.software.update({
    where: { id: softwareId },
    data: { ...data, slug },
  });

  await logActivity({
    userId: user.id,
    action: "software.update",
    entityType: "Software",
    entityId: softwareId,
  });

  revalidatePath("/admin/software");
  revalidatePath(`/admin/software/${softwareId}`);
  redirect(`/admin/software/${softwareId}`);
}

export async function deleteSoftwareAction(softwareId: string) {
  const user = await getAdminActionUser("software.delete");
  await prisma.software.update({
    where: { id: softwareId },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
  await logActivity({
    userId: user.id,
    action: "software.delete",
    entityType: "Software",
    entityId: softwareId,
  });
  revalidatePath("/admin/software");
  redirect("/admin/software");
}

export async function verifySoftwareAction(softwareId: string) {
  const user = await getAdminActionUser("software.verify");
  await prisma.$transaction([
    prisma.software.update({
      where: { id: softwareId },
      data: {
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
        verifiedById: user.id,
      },
    }),
    prisma.softwareFile.updateMany({
      where: {
        softwareId,
        verificationStatus: { in: ["PENDING_REVIEW", "UNVERIFIED"] },
      },
      data: { verificationStatus: "VERIFIED" },
    }),
  ]);
  await logActivity({
    userId: user.id,
    action: "software.verify",
    entityType: "Software",
    entityId: softwareId,
  });
  revalidatePath(`/admin/software/${softwareId}`);
}

export async function rejectSoftwareAction(softwareId: string, formData: FormData) {
  const user = await getAdminActionUser("software.verify");
  const reason = String(formData.get("reason") || "").trim() || "Rejected by admin";
  await prisma.$transaction([
    prisma.software.update({
      where: { id: softwareId },
      data: {
        verificationStatus: "REJECTED",
        status: "REJECTED",
        verifiedAt: null,
        verifiedById: user.id,
      },
    }),
    prisma.softwareFile.updateMany({
      where: { softwareId },
      data: {
        verificationStatus: "REJECTED",
        scanResult: reason,
      },
    }),
  ]);
  await logActivity({
    userId: user.id,
    action: "software.reject",
    entityType: "Software",
    entityId: softwareId,
    metadata: { reason },
  });
  revalidatePath(`/admin/software/${softwareId}`);
}

export async function verifyFileAction(fileId: string) {
  const user = await getAdminActionUser("software.verify");
  const file = await prisma.softwareFile.findUnique({ where: { id: fileId } });
  if (!file) throw new ApiError(404, "NOT_FOUND", "File not found");
  await prisma.softwareFile.update({
    where: { id: fileId },
    data: { verificationStatus: "VERIFIED" },
  });
  await logActivity({
    userId: user.id,
    action: "software.file.verify",
    entityType: "SoftwareFile",
    entityId: fileId,
  });
  revalidatePath(`/admin/software/${file.softwareId}`);
}

export async function rejectFileAction(fileId: string) {
  const user = await getAdminActionUser("software.verify");
  const file = await prisma.softwareFile.findUnique({ where: { id: fileId } });
  if (!file) throw new ApiError(404, "NOT_FOUND", "File not found");
  await prisma.softwareFile.update({
    where: { id: fileId },
    data: { verificationStatus: "REJECTED" },
  });
  await logActivity({
    userId: user.id,
    action: "software.file.reject",
    entityType: "SoftwareFile",
    entityId: fileId,
  });
  revalidatePath(`/admin/software/${file.softwareId}`);
}
