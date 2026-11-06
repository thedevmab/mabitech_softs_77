import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  for (const environment of ["development", "production"] as const) {
    await prisma.adMobSettings.upsert({
      where: {
        platform_environment: { platform: "android", environment },
      },
      update: {},
      create: {
        platform: "android",
        environment,
        bannerEnabled: false,
        interstitialEnabled: false,
        nativeEnabled: false,
        appOpenEnabled: false,
        bannerOnHome: true,
        bannerOnExplore: true,
        bannerOnArticle: true,
        nativeOnHome: true,
        nativeOnExplore: true,
        interstitialCooldown: 300,
        interstitialSessionLimit: 5,
        nativeAdFrequency: 5,
        appOpenCooldown: 14400,
        childDirected: false,
        consentRequired: true,
      },
    });
  }
  console.log("AdMob settings seeded");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
