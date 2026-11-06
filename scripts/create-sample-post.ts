import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
  const cat = await prisma.category.findUnique({ where: { slug: "technology-news" } });
  if (!admin || !cat) throw new Error("Missing admin or category");

  const existing = await prisma.post.findUnique({ where: { slug: "welcome-to-tech-platform" } });
  if (existing) {
    console.log(existing.slug);
    return;
  }

  const post = await prisma.post.create({
    data: {
      title: "Welcome to Daily Tips",
      slug: "welcome-to-tech-platform",
      excerpt: "First published article",
      content:
        "<p>This is the first published article on the platform. New content appears in the Flutter app through the REST API without an app release.</p>",
      status: "PUBLISHED",
      isFeatured: true,
      publishedAt: new Date(),
      authorId: admin.id,
      categories: { create: [{ categoryId: cat.id }] },
    },
  });
  console.log(post.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
