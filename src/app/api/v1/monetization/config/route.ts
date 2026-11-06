import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";
import { getBearerUser } from "@/lib/auth/request-user";

export async function GET(request: Request) {
  try {
    const [site, app, user] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { id: "default" } }),
      prisma.appSettings.findUnique({ where: { id: "default" } }),
      getBearerUser(request),
    ]);

    const premiumActive =
      !!user &&
      user.isPremium &&
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

    return jsonOk({
      monetizationEnabled: site?.monetizationEnabled ?? true,
      adsEnabled: (site?.adsEnabled ?? false) && !premiumActive,
      registrationEnabled: site?.registrationEnabled ?? true,
      premium: {
        available: true,
        userIsPremium: premiumActive,
        expiresAt: user?.premiumExpiresAt ?? null,
      },
      featureFlags: app?.featureFlags ?? {},
      providers: {
        chapa: Boolean(process.env.CHAPA_SECRET_KEY),
        telebirr: Boolean(
          process.env.TELEBIRR_APP_ID && process.env.TELEBIRR_APP_KEY,
        ),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
