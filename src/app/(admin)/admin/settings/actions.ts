"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";

export async function updateSiteSettingsAction(formData: FormData) {
  const user = await getAdminActionUser("settings.manage");

  const uploadAllowedTypes = String(formData.get("uploadAllowedTypes") || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const seoKeywords = String(formData.get("seoKeywords") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let socialLinks: Prisma.InputJsonValue | undefined;
  const socialRaw = String(formData.get("socialLinks") || "").trim();
  if (socialRaw) {
    try {
      socialLinks = JSON.parse(socialRaw) as Prisma.InputJsonValue;
    } catch {
      socialLinks = undefined;
    }
  }

  const maxUploadMb = Number(formData.get("maxUploadMb") || 500);

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      platformName: String(formData.get("platformName") || "Daily Tips"),
      tagline: String(formData.get("tagline") || "Technology • Knowledge • Innovation"),
      logoUrl: String(formData.get("logoUrl") || "").trim() || null,
      faviconUrl: String(formData.get("faviconUrl") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
      contactEmail: String(formData.get("contactEmail") || "").trim() || null,
      contactPhone: String(formData.get("contactPhone") || "").trim() || null,
      contactAddress: String(formData.get("contactAddress") || "").trim() || null,
      ...(socialLinks !== undefined ? { socialLinks } : {}),
      defaultLanguage: String(formData.get("defaultLanguage") || "en"),
      theme: String(formData.get("theme") || "system"),
      adsEnabled: formData.get("adsEnabled") === "on",
      adsensePublisherId: String(formData.get("adsensePublisherId") || "").trim() || null,
      admobAppId: String(formData.get("admobAppId") || "").trim() || null,
      monetizationEnabled: formData.get("monetizationEnabled") === "on",
      registrationEnabled: formData.get("registrationEnabled") === "on",
      maintenanceMode: formData.get("maintenanceMode") === "on",
      maxUploadBytes: BigInt(Math.max(1, maxUploadMb) * 1024 * 1024),
      seoTitle: String(formData.get("seoTitle") || "").trim() || null,
      seoDescription: String(formData.get("seoDescription") || "").trim() || null,
      seoKeywords,
      uploadAllowedTypes,
    },
    create: {
      id: "default",
      platformName: String(formData.get("platformName") || "Daily Tips"),
      tagline: String(formData.get("tagline") || "Technology • Knowledge • Innovation"),
    },
  });

  await logActivity({
    userId: user.id,
    action: "settings.site.update",
    entityType: "SiteSettings",
    entityId: "default",
  });
  revalidatePath("/admin/settings");
}

export async function updateAppSettingsAction(formData: FormData) {
  const user = await getAdminActionUser("settings.manage");

  let featureFlags: Prisma.InputJsonValue | undefined;
  let adPolicy: Prisma.InputJsonValue | undefined;
  let branding: Prisma.InputJsonValue | undefined;
  let homeSections: Prisma.InputJsonValue | undefined;
  const flagsRaw = String(formData.get("featureFlags") || "").trim();
  const adPolicyRaw = String(formData.get("adPolicy") || "").trim();
  const brandingRaw = String(formData.get("branding") || "").trim();
  const homeSectionsRaw = String(formData.get("homeSections") || "").trim();
  try {
    if (flagsRaw) featureFlags = JSON.parse(flagsRaw) as Prisma.InputJsonValue;
  } catch {
    /* keep previous via omit */
  }
  try {
    if (adPolicyRaw) adPolicy = JSON.parse(adPolicyRaw) as Prisma.InputJsonValue;
  } catch {
    /* keep previous via omit */
  }
  try {
    if (brandingRaw) branding = JSON.parse(brandingRaw) as Prisma.InputJsonValue;
  } catch {
    /* keep previous via omit */
  }
  try {
    if (homeSectionsRaw) homeSections = JSON.parse(homeSectionsRaw) as Prisma.InputJsonValue;
  } catch {
    /* keep previous via omit */
  }

  const supportedLanguages = String(formData.get("supportedLanguages") || "en")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {
      minAppVersion: String(formData.get("minAppVersion") || "1.0.0"),
      recommendedAppVersion: String(formData.get("recommendedAppVersion") || "1.0.0"),
      forceUpdate: formData.get("forceUpdate") === "on",
      updateUrl: String(formData.get("updateUrl") || "").trim() || null,
      maintenanceMode: formData.get("appMaintenanceMode") === "on",
      maintenanceMessage: String(formData.get("maintenanceMessage") || "").trim() || null,
      announcementEnabled: formData.get("announcementEnabled") === "on",
      announcementTitle: String(formData.get("announcementTitle") || "").trim() || null,
      announcementBody: String(formData.get("announcementBody") || "").trim() || null,
      contentRefreshSeconds: Math.max(
        30,
        Math.min(86400, Number(formData.get("contentRefreshSeconds") || 300) || 300),
      ),
      supportedLanguages: supportedLanguages.length ? supportedLanguages : ["en"],
      privacyPolicyUrl: String(formData.get("privacyPolicyUrl") || "").trim() || null,
      termsOfServiceUrl: String(formData.get("termsOfServiceUrl") || "").trim() || null,
      registrationEnabled: formData.get("appRegistrationEnabled") === "on",
      requireEmailVerify: formData.get("requireEmailVerify") === "on",
      ...(featureFlags ? { featureFlags } : {}),
      ...(adPolicy ? { adPolicy } : {}),
      ...(branding ? { branding } : {}),
      ...(homeSections ? { homeSections } : {}),
    },
    create: {
      id: "default",
      minAppVersion: String(formData.get("minAppVersion") || "1.0.0"),
    },
  });

  await logActivity({
    userId: user.id,
    action: "settings.app.update",
    entityType: "AppSettings",
    entityId: "default",
  });
  revalidatePath("/admin/settings");
}
