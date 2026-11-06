import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APP_OPEN = "ca-app-pub-2620359636152769/3665089783";

async function main() {
  for (const environment of ["development", "production"] as const) {
    await prisma.adMobSettings.update({
      where: {
        platform_environment: { platform: "android", environment },
      },
      data: { appOpenAdUnitId: APP_OPEN },
    });
  }
  console.log("App Open unit ID saved:", APP_OPEN);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
