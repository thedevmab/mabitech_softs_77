import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UNITS = {
  bannerAdUnitId: "ca-app-pub-2620359636152769/5341133534",
  nativeAdUnitId: "ca-app-pub-2620359636152769/6271071820",
  interstitialAdUnitId: "ca-app-pub-2620359636152769/8984865071",
  // Rewarded ca-app-pub-2620359636152769/6455913815 is not used — app implements App Open, not Rewarded.
};

async function main() {
  for (const environment of ["development", "production"] as const) {
    await prisma.adMobSettings.upsert({
      where: {
        platform_environment: { platform: "android", environment },
      },
      update: UNITS,
      create: {
        platform: "android",
        environment,
        ...UNITS,
        bannerEnabled: false,
        interstitialEnabled: false,
        nativeEnabled: false,
        appOpenEnabled: false,
      },
    });
  }
  console.log("AdMob unit IDs saved for android development + production");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
