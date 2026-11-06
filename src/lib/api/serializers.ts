import type {
  Category,
  Comment,
  Post,
  PostFile,
  Software,
  SoftwareFile,
  SoftwareVersion,
  Tag,
  User,
} from "@prisma/client";

type AuthorLite = Pick<User, "id" | "name" | "image">;
type CategoryLite = Pick<Category, "id" | "name" | "slug" | "icon" | "description">;
type TagLite = Pick<Tag, "id" | "name" | "slug">;

export type PostFileLite = Pick<
  PostFile,
  | "id"
  | "originalName"
  | "extension"
  | "mimeType"
  | "sizeBytes"
  | "checksumSha256"
  | "apkPackage"
  | "apkVersionName"
  | "apkVersionCode"
  | "apkMinSdk"
  | "downloadCount"
>;

/** Shared Prisma include for API post serialization. */
export const postApiInclude = {
  author: { select: { id: true, name: true, image: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  file: true,
  _count: { select: { comments: { where: { status: "VISIBLE" as const } } } },
} as const;

export function serializePostFile(file: PostFileLite | null | undefined) {
  if (!file) return null;
  const isApk = file.extension.toLowerCase() === "apk";
  return {
    name: file.originalName,
    extension: file.extension,
    mimeType: file.mimeType,
    sizeBytes: Number(file.sizeBytes),
    isApk,
    downloadCount: file.downloadCount,
    apk: isApk
      ? {
          packageName: file.apkPackage,
          versionName: file.apkVersionName,
          versionCode: file.apkVersionCode,
          minSdkVersion: file.apkMinSdk,
        }
      : null,
  };
}

export function serializeUserPublic(user: {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  emailVerified: Date | null;
  createdAt: Date;
}) {
  const premiumActive =
    user.isPremium &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    bio: user.bio,
    isPremium: premiumActive,
    premiumExpiresAt: user.premiumExpiresAt,
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt,
  };
}

export function estimateReadingTimeMinutes(content: string | null | undefined): number {
  const text = (content || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&\w+;/g, " ")
    .trim();
  if (!text) return 1;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function serializePost(
  post: Post & {
    author?: AuthorLite | null;
    categories?: { category: CategoryLite }[];
    tags?: { tag: TagLite }[];
    file?: PostFileLite | null;
    _count?: { comments?: number };
  },
  opts?: { includeContent?: boolean },
) {
  const deliveryType = (post.deliveryType || "NONE").toString().toLowerCase() as
    | "none"
    | "file"
    | "link";

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: opts?.includeContent === false ? undefined : post.content,
    featuredImage: post.featuredImage,
    gallery: post.gallery,
    videoEmbed: post.videoEmbed,
    isFeatured: post.isFeatured,
    isSponsored: post.isSponsored,
    deliveryType,
    externalUrl: deliveryType === "link" ? post.externalUrl : null,
    linkDescription: deliveryType === "link" ? post.linkDescription : null,
    version: post.version,
    publisher: post.publisher,
    releaseDate: post.releaseDate,
    file: deliveryType === "file" ? serializePostFile(post.file) : null,
    viewCount: post.viewCount,
    readingTimeMinutes: estimateReadingTimeMinutes(post.content),
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author
      ? { id: post.author.id, name: post.author.name, image: post.author.image }
      : undefined,
    categories: post.categories?.map((c) => c.category) ?? [],
    tags: post.tags?.map((t) => t.tag) ?? [],
    commentCount: post._count?.comments,
  };
}

export function serializeSoftware(
  software: Software & {
    category?: CategoryLite | null;
    versions?: SoftwareVersion[];
    files?: SoftwareFile[];
    affiliateCampaign?: {
      disclosure: string | null;
      destinationUrl: string;
      isActive: boolean;
    } | null;
    _count?: { favorites?: number; reviews?: number };
    avgRating?: number | null;
  },
  opts?: { installedVersionCode?: number | null },
) {
  const latest = software.versions?.find((v) => v.isLatest) || software.versions?.[0];
  const verifiedFile =
    software.files?.find((f) => f.verificationStatus === "VERIFIED") ||
    software.files?.[0];

  let installStatus: "not_installed" | "update_available" | "up_to_date" | null = null;
  if (opts?.installedVersionCode != null && latest?.versionCode != null) {
    if (opts.installedVersionCode <= 0) installStatus = "not_installed";
    else if (opts.installedVersionCode < latest.versionCode) installStatus = "update_available";
    else installStatus = "up_to_date";
  } else if (opts?.installedVersionCode != null) {
    installStatus = opts.installedVersionCode <= 0 ? "not_installed" : "up_to_date";
  }

  const channelPayload =
    software.channel === "HOSTED_FILE"
      ? {
          action: "download" as const,
          sizeBytes: verifiedFile ? Number(verifiedFile.sizeBytes) : null,
          checksumSha256: verifiedFile?.checksumSha256 ?? null,
          verificationStatus: software.verificationStatus,
          mimeType: verifiedFile?.mimeType ?? null,
          extension: verifiedFile?.extension ?? null,
          installGuidance:
            verifiedFile?.extension === "apk"
              ? "Enable install from unknown sources only from trusted sources. A download is not an installation."
              : null,
        }
      : software.channel === "EXTERNAL_URL"
        ? {
            action: "external" as const,
            url: software.externalUrl,
            affiliateDisclosure:
              software.affiliateCampaign?.isActive
                ? software.affiliateCampaign.disclosure
                : null,
          }
        : {
            action: "google_play" as const,
            url: software.googlePlayUrl,
          };

  return {
    id: software.id,
    name: software.name,
    slug: software.slug,
    shortDescription: software.shortDescription,
    description: software.description,
    iconUrl: software.iconUrl,
    coverUrl: software.coverUrl,
    screenshots: software.screenshots,
    developerName: software.developerName,
    officialWebsite: software.officialWebsite,
    supportedOs: software.supportedOs,
    minAndroidVersion: software.minAndroidVersion,
    channel: software.channel,
    isFree: software.isFree,
    isPremium: software.isPremium,
    isFeatured: software.isFeatured,
    downloadCount: software.downloadCount,
    viewCount: software.viewCount,
    releaseDate: software.releaseDate,
    category: software.category
      ? {
          id: software.category.id,
          name: software.category.name,
          slug: software.category.slug,
          icon: software.category.icon,
        }
      : null,
    latestVersion: latest
      ? {
          id: latest.id,
          version: latest.version,
          versionCode: latest.versionCode,
          changelog: latest.changelog,
          releaseDate: latest.releaseDate,
        }
      : null,
    distribution: channelPayload,
    installStatus,
    favoriteCount: software._count?.favorites,
    reviewCount: software._count?.reviews,
    avgRating: software.avgRating ?? null,
    createdAt: software.createdAt,
    updatedAt: software.updatedAt,
  };
}

export function serializeComment(
  comment: Comment & { user?: AuthorLite | null },
) {
  return {
    id: comment.id,
    body: comment.body,
    parentId: comment.parentId,
    createdAt: comment.createdAt,
    user: comment.user
      ? { id: comment.user.id, name: comment.user.name, image: comment.user.image }
      : null,
  };
}

export function publicPostWhere() {
  return {
    deletedAt: null,
    OR: [
      { status: "PUBLISHED" as const },
      {
        status: "SCHEDULED" as const,
        scheduledAt: { lte: new Date() },
      },
    ],
  };
}

export const publicSoftwareWhere = {
  deletedAt: null,
  status: "PUBLISHED" as const,
  OR: [
    { channel: "EXTERNAL_URL" as const },
    { channel: "GOOGLE_PLAY" as const },
    {
      channel: "HOSTED_FILE" as const,
      verificationStatus: "VERIFIED" as const,
    },
  ],
};
