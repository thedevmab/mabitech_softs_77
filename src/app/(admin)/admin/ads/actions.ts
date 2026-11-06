"use server";

import { revalidatePath } from "next/cache";
import { AdPlatform, AdType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";
import { ApiError } from "@/lib/api";

export async function togglePlacementAction(formData: FormData) {
  const user = await getAdminActionUser("ads.manage");
  const id = String(formData.get("id") || "");
  const placement = await prisma.adPlacement.findUnique({ where: { id } });
  if (!placement) throw new ApiError(404, "NOT_FOUND", "Placement not found");
  await prisma.adPlacement.update({
    where: { id },
    data: { isEnabled: !placement.isEnabled },
  });
  await logActivity({
    userId: user.id,
    action: "ads.placement.toggle",
    entityType: "AdPlacement",
    entityId: id,
  });
  revalidatePath("/admin/ads");
}

export async function createAdAction(formData: FormData) {
  const user = await getAdminActionUser("ads.manage");
  const name = String(formData.get("name") || "").trim();
  const typeRaw = String(formData.get("type") || "BANNER");
  const platformRaw = String(formData.get("platform") || "BOTH");
  const unitId = String(formData.get("unitId") || "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") || "").trim() || null;
  const destinationUrl = String(formData.get("destinationUrl") || "").trim() || null;
  if (!name) throw new ApiError(400, "VALIDATION", "Name is required");

  const type = (Object.values(AdType) as string[]).includes(typeRaw)
    ? (typeRaw as AdType)
    : AdType.BANNER;
  const platform = (Object.values(AdPlatform) as string[]).includes(platformRaw)
    ? (platformRaw as AdPlatform)
    : AdPlatform.BOTH;

  const ad = await prisma.advertisement.create({
    data: {
      name,
      type,
      platform,
      unitId,
      imageUrl,
      destinationUrl,
      isEnabled: true,
    },
  });
  await logActivity({
    userId: user.id,
    action: "ads.create",
    entityType: "Advertisement",
    entityId: ad.id,
  });
  revalidatePath("/admin/ads");
}

export async function toggleAdAction(formData: FormData) {
  const user = await getAdminActionUser("ads.manage");
  const id = String(formData.get("id") || "");
  const ad = await prisma.advertisement.findUnique({ where: { id } });
  if (!ad) throw new ApiError(404, "NOT_FOUND", "Ad not found");
  await prisma.advertisement.update({
    where: { id },
    data: { isEnabled: !ad.isEnabled },
  });
  await logActivity({
    userId: user.id,
    action: "ads.toggle",
    entityType: "Advertisement",
    entityId: id,
  });
  revalidatePath("/admin/ads");
}

export async function createPlacementAction(formData: FormData) {
  const user = await getAdminActionUser("ads.manage");
  const key = String(formData.get("key") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const platformRaw = String(formData.get("platform") || "WEBSITE");
  const adId = String(formData.get("adId") || "").trim() || null;
  if (!key || !name) throw new ApiError(400, "VALIDATION", "Key and name are required");
  const platform = (Object.values(AdPlatform) as string[]).includes(platformRaw)
    ? (platformRaw as AdPlatform)
    : AdPlatform.WEBSITE;

  const placement = await prisma.adPlacement.create({
    data: { key, name, platform, adId, isEnabled: true },
  });
  await logActivity({
    userId: user.id,
    action: "ads.placement.create",
    entityType: "AdPlacement",
    entityId: placement.id,
  });
  revalidatePath("/admin/ads");
}
