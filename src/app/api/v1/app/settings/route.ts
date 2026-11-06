import { prisma } from "@/lib/db";
import { handleApiError, jsonOk, publicCacheHeaders } from "@/lib/api";
import {
  DAILY_TIPS_TAGLINE,
  DEFAULT_BRANDING,
  DEFAULT_HOME_SECTIONS,
} from "@/lib/branding";

export async function GET() {
  try {
    const [app, site] = await Promise.all([
      prisma.appSettings.findUnique({ where: { id: "default" } }),
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
    ]);

    return jsonOk(
      {
        minAppVersion: app?.minAppVersion ?? "1.0.0",
        recommendedAppVersion: app?.recommendedAppVersion ?? app?.minAppVersion ?? "1.0.0",
        forceUpdate: app?.forceUpdate ?? false,
        updateUrl: app?.updateUrl ?? null,
        maintenanceMode: app?.maintenanceMode || site?.maintenanceMode || false,
        maintenanceMessage: app?.maintenanceMessage ?? null,
        announcementEnabled: app?.announcementEnabled ?? false,
        announcementTitle: app?.announcementTitle ?? null,
        announcementBody: app?.announcementBody ?? null,
        contentRefreshSeconds: app?.contentRefreshSeconds ?? 300,
        supportedLanguages: app?.supportedLanguages?.length
          ? app.supportedLanguages
          : ["en"],
        privacyPolicyUrl: app?.privacyPolicyUrl ?? null,
        termsOfServiceUrl: app?.termsOfServiceUrl ?? null,
        registrationEnabled:
          (app?.registrationEnabled ?? true) && (site?.registrationEnabled ?? true),
        requireEmailVerify: app?.requireEmailVerify ?? true,
        featureFlags: app?.featureFlags ?? {},
        adPolicy: app?.adPolicy ?? {},
        branding: app?.branding ?? DEFAULT_BRANDING,
        homeSections: app?.homeSections ?? DEFAULT_HOME_SECTIONS,
        platformName: site?.platformName ?? "Daily Tips",
        tagline: site?.tagline ?? DAILY_TIPS_TAGLINE,
        logoUrl: site?.logoUrl ?? null,
        description: site?.description ?? null,
        contactEmail: site?.contactEmail ?? null,
        contactPhone: site?.contactPhone ?? null,
        contactAddress: site?.contactAddress ?? null,
        socialLinks: site?.socialLinks ?? null,
        theme: site?.theme ?? "system",
        defaultLanguage: site?.defaultLanguage ?? "en",
        monetizationEnabled: site?.monetizationEnabled ?? true,
        adsEnabled: site?.adsEnabled ?? false,
      },
      { headers: publicCacheHeaders(30) },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
