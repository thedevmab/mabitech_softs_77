import { prisma } from "@/lib/db";
import { handleApiError, jsonOk, publicCacheHeaders } from "@/lib/api";
import {
  postApiInclude,
  publicPostWhere,
  publicSoftwareWhere,
  serializePost,
  serializeSoftware,
} from "@/lib/api/serializers";
import {
  DEFAULT_HOME_SECTIONS,
  type HomeSectionConfig,
} from "@/lib/branding";

function asSections(value: unknown): HomeSectionConfig[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_HOME_SECTIONS;
  return value as HomeSectionConfig[];
}

async function loadPosts(section: HomeSectionConfig) {
  const where: Record<string, unknown> = { ...publicPostWhere() };
  if (section.featured) where.isFeatured = true;
  if (section.categorySlugs?.length) {
    where.categories = {
      some: { category: { slug: { in: section.categorySlugs } } },
    };
  }

  try {
    const posts = await prisma.post.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: section.limit || 8,
      include: postApiInclude,
    });
    return posts.map((p) => serializePost(p, { includeContent: false }));
  } catch {
    return [];
  }
}

async function loadSoftware(section: HomeSectionConfig) {
  const where: Record<string, unknown> = { ...publicSoftwareWhere };
  if (section.featured) where.isFeatured = true;
  if (section.premium) where.isPremium = true;
  if (section.osIncludes) {
    where.supportedOs = { has: section.osIncludes };
  }
  if (section.categorySlugs?.length) {
    where.category = { slug: { in: section.categorySlugs } };
  }

  try {
    const items = await prisma.software.findMany({
      where,
      orderBy: section.orderByDownloads
        ? [{ downloadCount: "desc" }, { createdAt: "desc" }]
        : [{ releaseDate: "desc" }, { createdAt: "desc" }],
      take: section.limit || 8,
      include: {
        category: true,
        versions: { where: { isLatest: true }, take: 1 },
        files: { take: 3, orderBy: { createdAt: "desc" } },
        affiliateCampaign: {
          select: { disclosure: true, destinationUrl: true, isActive: true },
        },
        _count: { select: { favorites: true, reviews: true } },
      },
    });
    return items.map((s) => serializeSoftware(s));
  } catch {
    return [];
  }
}

async function loadSponsored(limit: number) {
  const now = new Date();
  try {
    const rows = await prisma.sponsoredCampaign.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: { startAt: "desc" },
      take: limit || 6,
    });

    return rows.map((row) => ({
      id: row.id,
      sponsorName: row.sponsorName,
      title: row.title,
      description: row.description,
      bannerUrl: row.bannerUrl,
      destinationUrl: row.destinationUrl,
      labeled: true as const,
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    let sections = DEFAULT_HOME_SECTIONS.filter((s) => s.enabled);
    try {
      const app = await prisma.appSettings.findUnique({ where: { id: "default" } });
      sections = asSections(app?.homeSections).filter((s) => s.enabled);
    } catch {
      // Keep defaults when production DB is unavailable.
    }

    const resolved = await Promise.all(
      sections.map(async (section) => {
        let items: unknown[] = [];
        if (section.type === "posts") items = await loadPosts(section);
        else if (section.type === "software") items = await loadSoftware(section);
        else if (section.type === "sponsored") items = await loadSponsored(section.limit);

        return {
          key: section.key,
          title: section.title,
          type: section.type,
          items,
        };
      }),
    );

    return jsonOk({ sections: resolved }, { headers: publicCacheHeaders(30) });
  } catch (error) {
    return handleApiError(error);
  }
}
