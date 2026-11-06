"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PostDeliveryType, PostStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { makeSlug } from "@/lib/utils";
import { sanitizeContent } from "@/lib/admin/sanitize";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { parseDeliveryType, validateExternalUrl } from "@/lib/posts/delivery";
import { removePostFile } from "@/lib/storage/files";

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function ensureTags(names: string[]) {
  const tags = [];
  for (const name of names) {
    const slug = makeSlug(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    tags.push(tag);
  }
  return tags;
}

function formPostData(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim() || null;
  const content = sanitizeContent(String(formData.get("content") || ""));
  const featuredImage = String(formData.get("featuredImage") || "").trim() || null;
  const seoTitle = String(formData.get("seoTitle") || "").trim() || null;
  const seoDescription = String(formData.get("seoDescription") || "").trim() || null;
  const keywords = String(formData.get("keywords") || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const statusRaw = String(formData.get("status") || "DRAFT");
  const status = (Object.values(PostStatus) as string[]).includes(statusRaw)
    ? (statusRaw as PostStatus)
    : PostStatus.DRAFT;
  const scheduledAtRaw = String(formData.get("scheduledAt") || "");
  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
  const isFeatured = formData.get("isFeatured") === "on";
  const isSponsored = formData.get("isSponsored") === "on";
  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
  const tagNames = parseTags(String(formData.get("tags") || ""));

  const deliveryType = parseDeliveryType(String(formData.get("deliveryType") || "NONE"));
  const fileIdRaw = String(formData.get("fileId") || "").trim() || null;
  const externalUrlRaw = String(formData.get("externalUrl") || "").trim();
  const linkDescription = String(formData.get("linkDescription") || "").trim() || null;
  const version = String(formData.get("version") || "").trim() || null;
  const publisher = String(formData.get("publisher") || "").trim() || null;
  const releaseDateRaw = String(formData.get("releaseDate") || "");
  const releaseDate = releaseDateRaw ? new Date(releaseDateRaw) : null;

  if (!title) throw new ApiError(400, "VALIDATION", "Title is required");
  if (!content.trim()) throw new ApiError(400, "VALIDATION", "Content is required");

  let externalUrl: string | null = null;
  let fileId: string | null = null;

  if (deliveryType === PostDeliveryType.LINK) {
    externalUrl = validateExternalUrl(externalUrlRaw);
    fileId = null;
  } else if (deliveryType === PostDeliveryType.FILE) {
    if (!fileIdRaw) {
      throw new ApiError(400, "VALIDATION", "A file upload is required for file posts");
    }
    fileId = fileIdRaw;
    externalUrl = null;
  } else {
    fileId = null;
    externalUrl = null;
  }

  return {
    title,
    slug: makeSlug(slugInput || title),
    excerpt,
    content,
    featuredImage,
    seoTitle,
    seoDescription,
    keywords,
    status,
    scheduledAt,
    isFeatured,
    isSponsored,
    categoryIds,
    tagNames,
    deliveryType,
    fileId,
    externalUrl,
    linkDescription: deliveryType === PostDeliveryType.LINK ? linkDescription : null,
    version,
    publisher,
    releaseDate,
    publishedAt:
      status === "PUBLISHED" ? new Date() : status === "SCHEDULED" ? scheduledAt : null,
  };
}

async function assertFileExists(fileId: string | null) {
  if (!fileId) return;
  const file = await prisma.postFile.findUnique({ where: { id: fileId } });
  if (!file) throw new ApiError(400, "VALIDATION", "Uploaded file was not found");
}

async function cleanupReplacedFile(oldFileId: string | null, nextFileId: string | null) {
  if (!oldFileId || oldFileId === nextFileId) return;
  try {
    await removePostFile(oldFileId);
  } catch {
    // Detach first so CHECK constraint and FILE_IN_USE don't block
    await prisma.post.updateMany({
      where: { fileId: oldFileId },
      data: { fileId: null },
    });
    await removePostFile(oldFileId).catch(() => undefined);
  }
}

export async function createPostAction(formData: FormData) {
  const user = await getAdminActionUser("posts.create");
  const data = formPostData(formData);

  if (data.status === "PUBLISHED" || data.status === "SCHEDULED") {
    await getAdminActionUser("posts.publish");
  }

  await assertFileExists(data.fileId);
  const tags = await ensureTags(data.tagNames);

  let slug = data.slug;
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  // Ensure file is not already attached to another post
  if (data.fileId) {
    const taken = await prisma.post.findFirst({
      where: { fileId: data.fileId, deletedAt: null },
    });
    if (taken) {
      throw new ApiError(400, "VALIDATION", "That file is already attached to another post");
    }
  }

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      featuredImage: data.featuredImage,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      keywords: data.keywords,
      status: data.status,
      scheduledAt: data.scheduledAt,
      publishedAt: data.publishedAt,
      isFeatured: data.isFeatured,
      isSponsored: data.isSponsored,
      deliveryType: data.deliveryType,
      externalUrl: data.externalUrl,
      linkDescription: data.linkDescription,
      version: data.version,
      publisher: data.publisher,
      releaseDate: data.releaseDate,
      fileId: data.fileId,
      authorId: user.id,
      categories: {
        create: data.categoryIds.map((categoryId) => ({ categoryId })),
      },
      tags: {
        create: tags.map((t) => ({ tagId: t.id })),
      },
    },
  });

  await logActivity({
    userId: user.id,
    action: "posts.create",
    entityType: "Post",
    entityId: post.id,
  });

  revalidatePath("/admin/posts");
  redirect(`/admin/posts/${post.id}`);
}

export async function updatePostAction(postId: string, formData: FormData) {
  const user = await getAdminActionUser("posts.edit");
  const data = formPostData(formData);

  const existing = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
  });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Post not found");

  if (
    (data.status === "PUBLISHED" || data.status === "SCHEDULED") &&
    existing.status !== data.status
  ) {
    await getAdminActionUser("posts.publish");
  }

  await assertFileExists(data.fileId);

  if (data.fileId && data.fileId !== existing.fileId) {
    const taken = await prisma.post.findFirst({
      where: { fileId: data.fileId, deletedAt: null, NOT: { id: postId } },
    });
    if (taken) {
      throw new ApiError(400, "VALIDATION", "That file is already attached to another post");
    }
  }

  const tags = await ensureTags(data.tagNames);

  let slug = data.slug;
  const slugClash = await prisma.post.findFirst({
    where: { slug, NOT: { id: postId } },
  });
  if (slugClash) slug = `${slug}-${Date.now().toString(36)}`;

  const previousFileId = existing.fileId;

  await prisma.$transaction(async (tx) => {
    await tx.postCategory.deleteMany({ where: { postId } });
    await tx.postTag.deleteMany({ where: { postId } });
    await tx.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        keywords: data.keywords,
        status: data.status,
        scheduledAt: data.scheduledAt,
        publishedAt:
          data.status === "PUBLISHED"
            ? existing.publishedAt || new Date()
            : data.status === "SCHEDULED"
              ? data.scheduledAt
              : null,
        isFeatured: data.isFeatured,
        isSponsored: data.isSponsored,
        deliveryType: data.deliveryType,
        externalUrl: data.externalUrl,
        linkDescription: data.linkDescription,
        version: data.version,
        publisher: data.publisher,
        releaseDate: data.releaseDate,
        fileId: data.fileId,
        categories: {
          create: data.categoryIds.map((categoryId) => ({ categoryId })),
        },
        tags: {
          create: tags.map((t) => ({ tagId: t.id })),
        },
      },
    });
  });

  if (previousFileId && previousFileId !== data.fileId) {
    await cleanupReplacedFile(previousFileId, data.fileId);
  }

  await logActivity({
    userId: user.id,
    action: "posts.update",
    entityType: "Post",
    entityId: postId,
  });

  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${postId}`);
  redirect(`/admin/posts/${postId}`);
}

export async function deletePostAction(postId: string) {
  const user = await getAdminActionUser("posts.delete");
  const existing = await prisma.post.findFirst({
    where: { id: postId },
    select: { fileId: true },
  });

  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date(), status: "ARCHIVED", fileId: null, deliveryType: "NONE" },
  });

  if (existing?.fileId) {
    await removePostFile(existing.fileId).catch(() => undefined);
  }

  await logActivity({
    userId: user.id,
    action: "posts.delete",
    entityType: "Post",
    entityId: postId,
  });
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}
