import { connection } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Defer database work until a real request so production builds do not prerender it. */
async function onRequest() {
  await connection();
}

function publishedPostWhere(): Prisma.PostWhereInput {
  return {
    status: "PUBLISHED",
    deletedAt: null,
    OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
  };
}

function publishedSoftwareWhere(): Prisma.SoftwareWhereInput {
  return {
    status: "PUBLISHED",
    deletedAt: null,
  };
}

export const postListInclude = {
  author: { select: { id: true, name: true, image: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.PostInclude;

export const softwareListInclude = {
  category: true,
  versions: {
    where: { isLatest: true },
    take: 1,
    orderBy: { releaseDate: "desc" as const },
  },
} satisfies Prisma.SoftwareInclude;

export type PostCardData = Prisma.PostGetPayload<{ include: typeof postListInclude }>;
export type SoftwareCardData = Prisma.SoftwareGetPayload<{ include: typeof softwareListInclude }>;

export async function getPublishedPosts(opts?: {
  take?: number;
  featured?: boolean;
  categorySlugs?: string[];
  skip?: number;
}) {
  await onRequest();
  const where: Prisma.PostWhereInput = {
    ...publishedPostWhere(),
    ...(opts?.featured ? { isFeatured: true } : {}),
    ...(opts?.categorySlugs?.length
      ? { categories: { some: { category: { slug: { in: opts.categorySlugs } } } } }
      : {}),
  };

  try {
    return await prisma.post.findMany({
      where,
      include: postListInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: opts?.take ?? 12,
      skip: opts?.skip ?? 0,
    });
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  await onRequest();
  return prisma.post.findFirst({
    where: { slug, ...publishedPostWhere() },
    include: {
      ...postListInclude,
      comments: {
        where: { status: "VISIBLE", parentId: null },
        include: {
          user: { select: { id: true, name: true, image: true } },
          replies: {
            where: { status: "VISIBLE" },
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function getPublishedSoftware(opts?: {
  take?: number;
  featured?: boolean;
  premium?: boolean;
  categorySlugs?: string[];
  osIncludes?: string;
  orderByDownloads?: boolean;
  skip?: number;
}) {
  await onRequest();
  const where: Prisma.SoftwareWhereInput = {
    ...publishedSoftwareWhere(),
    ...(opts?.featured ? { isFeatured: true } : {}),
    ...(opts?.premium ? { isPremium: true } : {}),
    ...(opts?.categorySlugs?.length
      ? { category: { slug: { in: opts.categorySlugs } } }
      : {}),
    ...(opts?.osIncludes
      ? {
          OR: [
            { supportedOs: { has: opts.osIncludes } },
            { supportedOs: { has: opts.osIncludes.toLowerCase() } },
            { supportedOs: { has: opts.osIncludes.toUpperCase() } },
            ...(opts.osIncludes.toLowerCase() === "android"
              ? [{ minAndroidVersion: { not: null } }, { channel: "GOOGLE_PLAY" as const }]
              : []),
          ],
        }
      : {}),
  };

  try {
    return await prisma.software.findMany({
      where,
      include: softwareListInclude,
      orderBy: opts?.orderByDownloads
        ? [{ downloadCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
      take: opts?.take ?? 12,
      skip: opts?.skip ?? 0,
    });
  } catch {
    return [];
  }
}

export async function getSoftwareBySlug(slug: string) {
  await onRequest();
  return prisma.software.findFirst({
    where: { slug, ...publishedSoftwareWhere() },
    include: {
      category: true,
      versions: {
        orderBy: { releaseDate: "desc" },
        include: { files: true },
      },
      files: {
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      verifiedBy: { select: { id: true, name: true } },
    },
  });
}

export async function getCategories() {
  await onRequest();
  try {
    return await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            posts: true,
            software: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  await onRequest();
  return prisma.category.findUnique({
    where: { slug },
    include: {
      children: { orderBy: { sortOrder: "asc" } },
      parent: true,
    },
  });
}

export async function getSubscriptionPlans() {
  await onRequest();
  try {
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceCents: "asc" },
    });
  } catch {
    return [];
  }
}
