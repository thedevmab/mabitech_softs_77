import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APP_ID = "ca-app-pub-2620359636152769~2499347779";

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: { admobAppId: APP_ID },
    create: { id: "default", admobAppId: APP_ID },
  });

  for (const environment of ["development", "production"] as const) {
    await prisma.adMobSettings.upsert({
      where: {
        platform_environment: { platform: "android", environment },
      },
      update: { appId: APP_ID },
      create: {
        platform: "android",
        environment,
        appId: APP_ID,
        bannerAdUnitId: "ca-app-pub-2620359636152769/5341133534",
        nativeAdUnitId: "ca-app-pub-2620359636152769/6271071820",
        interstitialAdUnitId: "ca-app-pub-2620359636152769/8984865071",
      },
    });
  }

  console.log("AdMob App ID saved:", APP_ID);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
