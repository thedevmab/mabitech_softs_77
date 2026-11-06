import { prisma } from "@/lib/db";
import { handleApiError, jsonOk, publicCacheHeaders } from "@/lib/api";
import { getBearerUser } from "@/lib/auth/request-user";
import { publicAdMobConfig, resolveAdMobEnvironment } from "@/lib/admob";

export async function GET(request: Request) {
  try {
    const [site, user, settings] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      getBearerUser(request),
      prisma.adMobSettings.findUnique({
        where: {
          platform_environment: {
            platform: "android",
            environment: resolveAdMobEnvironment(),
          },
        },
      }),
    ]);

    const premiumActive =
      !!user &&
      user.isPremium &&
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

    const adsEnabled = (site?.adsEnabled ?? false) && !premiumActive;

    return jsonOk(publicAdMobConfig(adsEnabled, settings), {
      headers: publicCacheHeaders(60),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
