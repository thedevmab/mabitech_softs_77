"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";
import {
  clampAppOpenCooldown,
  clampInterstitialCooldown,
  clampInterstitialSessionLimit,
  clampNativeAdFrequency,
  isValidAdMobAppId,
  isValidAdMobUnitId,
} from "@/lib/admob";
import type { AdMobEnvironment } from "@prisma/client";

function optionalId(raw: FormDataEntryValue | null) {
  const value = String(raw || "").trim();
  return value || null;
}

function assertOptionalAppId(value: string | null, label: string) {
  if (value && !isValidAdMobAppId(value)) {
    throw new Error(`${label} must look like ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`);
  }
}

function assertOptionalUnitId(value: string | null, label: string) {
  if (value && !isValidAdMobUnitId(value)) {
    throw new Error(`${label} must look like ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`);
  }
}

export async function updateAdMobSettingsAction(formData: FormData) {
  const user = await getAdminActionUser("ads.manage");

  const environment = String(formData.get("environment") || "development") as AdMobEnvironment;
  if (environment !== "development" && environment !== "production") {
    throw new Error("Invalid environment");
  }

  const appId = optionalId(formData.get("appId"));
  const bannerAdUnitId = optionalId(formData.get("bannerAdUnitId"));
  const interstitialAdUnitId = optionalId(formData.get("interstitialAdUnitId"));
  const nativeAdUnitId = optionalId(formData.get("nativeAdUnitId"));
  const appOpenAdUnitId = optionalId(formData.get("appOpenAdUnitId"));

  assertOptionalAppId(appId, "App ID");
  assertOptionalUnitId(bannerAdUnitId, "Banner ad unit ID");
  assertOptionalUnitId(interstitialAdUnitId, "Interstitial ad unit ID");
  assertOptionalUnitId(nativeAdUnitId, "Native ad unit ID");
  assertOptionalUnitId(appOpenAdUnitId, "App open ad unit ID");

  const data = {
    appId,
    bannerAdUnitId,
    interstitialAdUnitId,
    nativeAdUnitId,
    appOpenAdUnitId,
    bannerEnabled: formData.get("bannerEnabled") === "on",
    interstitialEnabled: formData.get("interstitialEnabled") === "on",
    nativeEnabled: formData.get("nativeEnabled") === "on",
    appOpenEnabled: formData.get("appOpenEnabled") === "on",
    bannerOnHome: formData.get("bannerOnHome") === "on",
    bannerOnExplore: formData.get("bannerOnExplore") === "on",
    bannerOnArticle: formData.get("bannerOnArticle") === "on",
    nativeOnHome: formData.get("nativeOnHome") === "on",
    nativeOnExplore: formData.get("nativeOnExplore") === "on",
    interstitialCooldown: clampInterstitialCooldown(
      Number(formData.get("interstitialCooldown") || 300),
    ),
    interstitialSessionLimit: clampInterstitialSessionLimit(
      Number(formData.get("interstitialSessionLimit") || 5),
    ),
    nativeAdFrequency: clampNativeAdFrequency(
      Number(formData.get("nativeAdFrequency") || 5),
    ),
    appOpenCooldown: clampAppOpenCooldown(Number(formData.get("appOpenCooldown") || 14400)),
    childDirected: formData.get("childDirected") === "on",
    consentRequired: formData.get("consentRequired") === "on",
  };

  const adsEnabled = formData.get("adsEnabled") === "on";

  await prisma.$transaction([
    prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { adsEnabled },
      create: { id: "default", adsEnabled },
    }),
    prisma.adMobSettings.upsert({
      where: {
        platform_environment: { platform: "android", environment },
      },
      update: data,
      create: {
        platform: "android",
        environment,
        ...data,
      },
    }),
  ]);

  await logActivity({
    userId: user.id,
    action: "admob.settings.update",
    entityType: "AdMobSettings",
    entityId: `android:${environment}`,
    metadata: { adsEnabled, environment },
  });

  revalidatePath("/admin/monetization");
}
