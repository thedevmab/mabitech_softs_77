import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  ROLE_SLUGS,
} from "../src/lib/permissions";

const prisma = new PrismaClient();

async function writeSampleFile(storageKey: string, contents: string) {
  const full = path.join(process.cwd(), "storage", "files", storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  const buffer = Buffer.from(contents, "utf8");
  await writeFile(full, buffer);
  return {
    buffer,
    checksumSha256: createHash("sha256").update(buffer).digest("hex"),
    sizeBytes: BigInt(buffer.length),
  };
}

async function ensureTag(name: string) {
  const slug = slugifyName(name);
  return prisma.tag.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
}

async function ensurePost(params: {
  authorId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categorySlugs: string[];
  tagNames?: string[];
  isFeatured?: boolean;
  isSponsored?: boolean;
  hoursAgo?: number;
}) {
  const publishedAt = new Date(Date.now() - (params.hoursAgo ?? 6) * 60 * 60 * 1000);
  const post = await prisma.post.upsert({
    where: { slug: params.slug },
    update: {
      title: params.title,
      excerpt: params.excerpt,
      content: params.content,
      status: "PUBLISHED",
      isFeatured: params.isFeatured ?? false,
      isSponsored: params.isSponsored ?? false,
      publishedAt,
      deletedAt: null,
      authorId: params.authorId,
    },
    create: {
      title: params.title,
      slug: params.slug,
      excerpt: params.excerpt,
      content: params.content,
      status: "PUBLISHED",
      isFeatured: params.isFeatured ?? false,
      isSponsored: params.isSponsored ?? false,
      publishedAt,
      authorId: params.authorId,
    },
  });

  await prisma.postCategory.deleteMany({ where: { postId: post.id } });
  for (const categorySlug of params.categorySlugs) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) continue;
    await prisma.postCategory.create({
      data: { postId: post.id, categoryId: category.id },
    });
  }

  if (params.tagNames?.length) {
    await prisma.postTag.deleteMany({ where: { postId: post.id } });
    for (const tagName of params.tagNames) {
      const tag = await ensureTag(tagName);
      await prisma.postTag.create({
        data: { postId: post.id, tagId: tag.id },
      });
    }
  }

  return post;
}

async function ensureHostedSoftware(params: {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  supportedOs: string[];
  isFeatured?: boolean;
  isFree?: boolean;
  fileName: string;
  mimeType: string;
  extension: string;
  fileBody: string;
  version: string;
  developerName: string;
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.categorySlug },
  });

  const software = await prisma.software.upsert({
    where: { slug: params.slug },
    update: {
      name: params.name,
      shortDescription: params.shortDescription,
      description: params.description,
      categoryId: category?.id,
      supportedOs: params.supportedOs,
      channel: "HOSTED_FILE",
      isFree: params.isFree ?? true,
      isPremium: false,
      isFeatured: params.isFeatured ?? false,
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      releaseDate: new Date(),
      developerName: params.developerName,
      deletedAt: null,
    },
    create: {
      name: params.name,
      slug: params.slug,
      shortDescription: params.shortDescription,
      description: params.description,
      categoryId: category?.id,
      supportedOs: params.supportedOs,
      channel: "HOSTED_FILE",
      isFree: params.isFree ?? true,
      isPremium: false,
      isFeatured: params.isFeatured ?? false,
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      releaseDate: new Date(),
      developerName: params.developerName,
    },
  });

  const version = await prisma.softwareVersion.upsert({
    where: {
      softwareId_version: { softwareId: software.id, version: params.version },
    },
    update: {
      changelog: `Sample ${params.version} release for local testing.`,
      isLatest: true,
      releaseDate: new Date(),
    },
    create: {
      softwareId: software.id,
      version: params.version,
      changelog: `Sample ${params.version} release for local testing.`,
      isLatest: true,
      releaseDate: new Date(),
    },
  });

  await prisma.softwareVersion.updateMany({
    where: {
      softwareId: software.id,
      id: { not: version.id },
    },
    data: { isLatest: false },
  });

  const storageKey = `software/${software.id}/sample-${params.slug}.${params.extension}`;
  const stored = await writeSampleFile(storageKey, params.fileBody);

  const existingFile = await prisma.softwareFile.findFirst({
    where: { softwareId: software.id, storageKey },
  });

  if (existingFile) {
    await prisma.softwareFile.update({
      where: { id: existingFile.id },
      data: {
        versionId: version.id,
        fileName: params.fileName,
        originalName: params.fileName,
        mimeType: params.mimeType,
        extension: params.extension,
        sizeBytes: stored.sizeBytes,
        checksumSha256: stored.checksumSha256,
        storageBucket: "local",
        verificationStatus: "VERIFIED",
        scannedAt: new Date(),
        scanResult: "clean",
      },
    });
  } else {
    await prisma.softwareFile.create({
      data: {
        softwareId: software.id,
        versionId: version.id,
        fileName: params.fileName,
        originalName: params.fileName,
        mimeType: params.mimeType,
        extension: params.extension,
        sizeBytes: stored.sizeBytes,
        checksumSha256: stored.checksumSha256,
        storageKey,
        storageBucket: "local",
        verificationStatus: "VERIFIED",
        scannedAt: new Date(),
        scanResult: "clean",
      },
    });
  }

  return software;
}

const DEFAULT_CATEGORIES = [
  "Artificial Intelligence",
  "Android Applications",
  "Windows Software",
  "Computer Technology",
  "Programming",
  "Web Development",
  "Cybersecurity",
  "Digital Marketing",
  "Technology News",
  "Tutorials",
  "Graphics Design",
  "Video Editing",
  "Productivity Tools",
  "AI Tools",
  "Free Resources",
];

function slugifyName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name,
        group: permission.group,
      },
      create: {
        key: permission.key,
        name: permission.name,
        group: permission.group,
        description: permission.name,
      },
    });
  }

  const roles = [
    { name: "Super Admin", slug: ROLE_SLUGS.SUPER_ADMIN, description: "Full platform control" },
    { name: "Administrator", slug: ROLE_SLUGS.ADMINISTRATOR, description: "Operational administrator" },
    { name: "Editor", slug: ROLE_SLUGS.EDITOR, description: "Creates and edits articles" },
    { name: "Content Manager", slug: ROLE_SLUGS.CONTENT_MANAGER, description: "Publishes content and software" },
    { name: "Moderator", slug: ROLE_SLUGS.MODERATOR, description: "Moderates community content" },
    { name: "Analyst", slug: ROLE_SLUGS.ANALYST, description: "Views analytics and revenue" },
  ];

  for (const role of roles) {
    const saved = await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description, isSystem: true },
      create: { ...role, isSystem: true },
    });

    const keys = DEFAULT_ROLE_PERMISSIONS[role.slug] || [];
    for (const key of keys) {
      const permission = await prisma.permission.findUnique({ where: { key } });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: saved.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: saved.id, permissionId: permission.id },
      });
    }
  }

  for (const [index, name] of DEFAULT_CATEGORIES.entries()) {
    const slug = slugifyName(name);
    await prisma.category.upsert({
      where: { slug },
      update: { name, sortOrder: index, isDefault: true },
      create: { name, slug, sortOrder: index, isDefault: true },
    });
  }

  const { DEFAULT_BRANDING, DEFAULT_HOME_SECTIONS, DAILY_TIPS_TAGLINE } = await import(
    "../src/lib/branding"
  );

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      platformName: "Daily Tips",
      tagline: DAILY_TIPS_TAGLINE,
      description:
        "Daily Tips is your daily destination for technology news, AI discoveries, software downloads, digital skills, technology tutorials, and useful resources.",
    },
    create: {
      id: "default",
      platformName: "Daily Tips",
      tagline: DAILY_TIPS_TAGLINE,
      description:
        "Daily Tips is your daily destination for technology news, AI discoveries, software downloads, digital skills, technology tutorials, and useful resources.",
      registrationEnabled: true,
      monetizationEnabled: true,
      adsEnabled: false,
      uploadAllowedTypes: [
        "apk",
        "aab",
        "exe",
        "msi",
        "zip",
        "rar",
        "pdf",
        "7z",
      ],
    },
  });

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {
      branding: DEFAULT_BRANDING,
      homeSections: DEFAULT_HOME_SECTIONS,
    },
    create: {
      id: "default",
      minAppVersion: "1.0.0",
      forceUpdate: false,
      maintenanceMode: false,
      registrationEnabled: true,
      requireEmailVerify: true,
      branding: DEFAULT_BRANDING,
      homeSections: DEFAULT_HOME_SECTIONS,
      featureFlags: {
        comments: true,
        reviews: true,
        premium: true,
        ads: true,
      },
      adPolicy: {
        consentRequired: true,
        adsEnabled: false,
      },
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      description: "Free account with standard access",
      priceCents: 0,
      currency: "ETB",
      intervalDays: 36500,
      features: ["Browse articles", "Download free software"],
      isActive: true,
      isFree: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { slug: "premium-monthly" },
    update: {},
    create: {
      name: "Premium Monthly",
      slug: "premium-monthly",
      description: "Ad-free experience and premium downloads",
      priceCents: 29900,
      currency: "ETB",
      intervalDays: 30,
      features: [
        "Ad-free experience",
        "Premium software downloads",
        "Exclusive tutorials",
        "Priority support",
      ],
      isActive: true,
      isFree: false,
    },
  });

  const placements = [
    { key: "website.header", name: "Website header banner", platform: "WEBSITE" as const },
    { key: "website.article_inline", name: "Website article inline", platform: "WEBSITE" as const },
    { key: "website.sidebar", name: "Website sidebar", platform: "WEBSITE" as const },
    { key: "flutter.banner", name: "Flutter banner", platform: "FLUTTER" as const },
    { key: "flutter.native", name: "Flutter native", platform: "FLUTTER" as const },
    { key: "flutter.interstitial", name: "Flutter interstitial", platform: "FLUTTER" as const },
    { key: "flutter.rewarded", name: "Flutter rewarded", platform: "FLUTTER" as const },
  ];

  for (const placement of placements) {
    await prisma.adPlacement.upsert({
      where: { key: placement.key },
      update: { name: placement.name, platform: placement.platform },
      create: { ...placement, isEnabled: false },
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMeImmediately1!";
  const name = process.env.SEED_ADMIN_NAME || "Super Admin";
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      emailVerified: new Date(),
      status: "ACTIVE",
    },
    create: {
      email,
      name,
      passwordHash,
      emailVerified: new Date(),
      status: "ACTIVE",
    },
  });

  const superAdminRole = await prisma.role.findUnique({ where: { slug: ROLE_SLUGS.SUPER_ADMIN } });
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: superAdminRole.id },
    });
  }

  await ensurePost({
    authorId: admin.id,
    title: "Daily Tips platform is live",
    slug: "daily-tips-platform-is-live",
    excerpt: "Featured launch note covering technology news, AI tools, and free downloads.",
    content: [
      "<p>Welcome to <strong>Daily Tips</strong> — your daily destination for technology news, AI discoveries, software downloads, and practical tutorials.</p>",
      "<p>This sample article is published so the admin dashboard and Flutter app can load real homepage content immediately after seed.</p>",
      "<ul><li>Browse breaking tech news</li><li>Discover AI tools</li><li>Download verified sample files</li></ul>",
    ].join(""),
    categorySlugs: ["technology-news"],
    tagNames: ["launch", "daily-tips"],
    isFeatured: true,
    hoursAgo: 2,
  });

  await ensurePost({
    authorId: admin.id,
    title: "Five AI tips you can use today",
    slug: "five-ai-tips-you-can-use-today",
    excerpt: "Practical AI habits for writers, developers, and creators.",
    content: [
      "<p>Artificial intelligence is most useful when it saves time on repeatable tasks.</p>",
      "<ol><li>Draft outlines before writing</li><li>Ask for alternative approaches</li><li>Verify facts before publishing</li><li>Reuse prompts as templates</li><li>Keep sensitive data offline</li></ol>",
    ].join(""),
    categorySlugs: ["artificial-intelligence", "ai-tools"],
    tagNames: ["ai", "productivity"],
    hoursAgo: 8,
  });

  await ensurePost({
    authorId: admin.id,
    title: "How to install an APK safely",
    slug: "how-to-install-an-apk-safely",
    excerpt: "A short tutorial for checking sources, permissions, and updates.",
    content: [
      "<p>Only install APKs from sources you trust. Prefer official stores when possible.</p>",
      "<p>Before installing: confirm the publisher, review permissions, and keep a recent device backup.</p>",
      "<p>After installing: open the app once, confirm it launches, then check for updates.</p>",
    ].join(""),
    categorySlugs: ["tutorials", "android-applications"],
    tagNames: ["android", "security"],
    hoursAgo: 14,
  });

  await ensurePost({
    authorId: admin.id,
    title: "Windows toolkit checklist for creators",
    slug: "windows-toolkit-checklist-for-creators",
    excerpt: "Core utilities every creator should keep updated on Windows.",
    content: [
      "<p>A lean Windows toolkit beats a crowded desktop full of unused apps.</p>",
      "<p>Start with a text editor, a screenshot tool, a media converter, and a reliable ZIP utility — then add specialty software only when a project needs it.</p>",
    ].join(""),
    categorySlugs: ["windows-software", "productivity-tools"],
    tagNames: ["windows", "tools"],
    hoursAgo: 20,
  });

  await ensureHostedSoftware({
    name: "Daily Tips Sample APK",
    slug: "daily-tips-sample-apk",
    shortDescription: "Tiny verified Android sample package for download testing.",
    description:
      "<p>This is a <strong>sample hosted APK-style file</strong> used for local download testing. It is not a real Android application.</p>",
    categorySlug: "android-applications",
    supportedOs: ["android"],
    isFeatured: true,
    fileName: "daily-tips-sample.apk",
    mimeType: "application/vnd.android.package-archive",
    extension: "apk",
    fileBody:
      "Daily Tips sample APK placeholder\nSafe for local download grant testing.\nNot a real Android package.\n",
    version: "1.0.0",
    developerName: "Daily Tips",
  });

  await ensureHostedSoftware({
    name: "Daily Tips Windows Utility",
    slug: "daily-tips-windows-utility",
    shortDescription: "Sample Windows ZIP with a tiny text payload.",
    description:
      "<p>Sample Windows software listing with a hosted ZIP download. Use it to verify admin software pages and Flutter download grants.</p>",
    categorySlug: "windows-software",
    supportedOs: ["windows"],
    isFeatured: true,
    fileName: "daily-tips-windows-utility.zip",
    mimeType: "application/zip",
    extension: "zip",
    fileBody:
      "PK\u0003\u0004Daily Tips sample ZIP placeholder for local download tests.\n",
    version: "1.0.0",
    developerName: "Daily Tips",
  });

  await ensureHostedSoftware({
    name: "AI Prompt Starter Pack",
    slug: "ai-prompt-starter-pack",
    shortDescription: "Free PDF-style resource with starter prompts.",
    description:
      "<p>A free sample resource under AI Tools / Free Resources. The attached file is a plain-text PDF stand-in for download testing.</p>",
    categorySlug: "ai-tools",
    supportedOs: ["android", "windows", "web"],
    isFeatured: false,
    fileName: "ai-prompt-starter-pack.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    fileBody:
      "%PDF-1.4\n% Daily Tips sample PDF placeholder for local downloads.\n",
    version: "1.0.0",
    developerName: "Daily Tips Editorial",
  });

  await ensureHostedSoftware({
    name: "Creator Media Pack",
    slug: "creator-media-pack",
    shortDescription: "Sample free media toolkit archive.",
    description:
      "<p>Another hosted free download so home sections, explore search, and admin software lists have multiple verified files.</p>",
    categorySlug: "free-resources",
    supportedOs: ["android", "windows"],
    isFeatured: false,
    fileName: "creator-media-pack.7z",
    mimeType: "application/x-7z-compressed",
    extension: "7z",
    fileBody: "Daily Tips sample 7z placeholder archive for local download testing.\n",
    version: "1.0.0",
    developerName: "Daily Tips Studio",
  });

  const now = new Date();
  await prisma.sponsoredCampaign.upsert({
    where: { id: "seed-sponsored-daily-tips" },
    update: {
      sponsorName: "Daily Tips",
      title: "Learn something useful every day",
      description: "Sample sponsored card for the Flutter home feed.",
      destinationUrl: "http://localhost:3000",
      startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    create: {
      id: "seed-sponsored-daily-tips",
      sponsorName: "Daily Tips",
      title: "Learn something useful every day",
      description: "Sample sponsored card for the Flutter home feed.",
      destinationUrl: "http://localhost:3000",
      startAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

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

  console.log(`Seed complete. Super admin: ${email}`);
  console.log("Sample content: 4 published posts, 4 downloadable software files, 1 sponsored card.");
  console.log("AdMob settings: android development + production rows (formats off).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
