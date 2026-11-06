import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const post = await prisma.post.findFirst({
    where: { slug: "welcome-to-tech-platform" },
    include: { categories: true },
  });
  console.log(post);
  const published = await prisma.post.findFirst({
    where: {
      slug: "welcome-to-tech-platform",
      status: "PUBLISHED",
      deletedAt: null,
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
    },
  });
  console.log("published match", Boolean(published));
}

main().finally(() => prisma.$disconnect());
