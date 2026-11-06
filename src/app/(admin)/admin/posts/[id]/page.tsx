import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PostForm } from "@/components/admin/post-form";
import { updatePostAction, deletePostAction } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("posts.edit");
  const { id } = await params;

  const [post, categories] = await Promise.all([
    prisma.post.findFirst({
      where: { id, deletedAt: null },
      include: {
        categories: true,
        tags: { include: { tag: true } },
        file: true,
      },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!post) notFound();

  const update = updatePostAction.bind(null, post.id);
  const remove = deletePostAction.bind(null, post.id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Edit post</CardTitle>
          <form action={remove}>
            <Button type="submit" variant="destructive" size="sm">
              Delete
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <PostForm
            categories={categories}
            action={update}
            submitLabel="Update post"
            initial={{
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt || "",
              content: post.content,
              featuredImage: post.featuredImage || "",
              seoTitle: post.seoTitle || "",
              seoDescription: post.seoDescription || "",
              keywords: post.keywords.join(", "),
              status: post.status,
              scheduledAt: post.scheduledAt
                ? format(post.scheduledAt, "yyyy-MM-dd'T'HH:mm")
                : "",
              isFeatured: post.isFeatured,
              isSponsored: post.isSponsored,
              categoryIds: post.categories.map((c) => c.categoryId),
              tags: post.tags.map((t) => t.tag.name).join(", "),
              deliveryType: post.deliveryType,
              externalUrl: post.externalUrl || "",
              linkDescription: post.linkDescription || "",
              version: post.version || "",
              publisher: post.publisher || "",
              releaseDate: post.releaseDate
                ? format(post.releaseDate, "yyyy-MM-dd")
                : "",
              file: post.file
                ? {
                    id: post.file.id,
                    originalName: post.file.originalName,
                    extension: post.file.extension,
                    mimeType: post.file.mimeType,
                    sizeBytes: post.file.sizeBytes.toString(),
                    checksumSha256: post.file.checksumSha256,
                    scanResult: post.file.scanResult,
                    scanSkipped: !post.file.scannedAt,
                    isApk: post.file.extension === "apk",
                    apk:
                      post.file.extension === "apk"
                        ? {
                            packageName: post.file.apkPackage,
                            versionName: post.file.apkVersionName,
                            versionCode: post.file.apkVersionCode,
                            minSdkVersion: post.file.apkMinSdk,
                          }
                        : null,
                  }
                : null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
