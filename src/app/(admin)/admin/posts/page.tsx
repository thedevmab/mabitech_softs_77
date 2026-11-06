import Link from "next/link";
import { format } from "date-fns";
import { PostDeliveryType, PostStatus } from "@prisma/client";
import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function deliveryBadge(type: PostDeliveryType) {
  switch (type) {
    case "FILE":
      return "bg-sky-500/15 text-sky-300";
    case "LINK":
      return "bg-amber-500/15 text-amber-300";
    default:
      return "bg-surface-muted text-muted";
  }
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    delivery?: string;
  }>;
}) {
  await requireAdminPermission("posts.view");
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const categorySlug = params.category?.trim() || "";
  const status =
    params.status && (Object.values(PostStatus) as string[]).includes(params.status)
      ? (params.status as PostStatus)
      : undefined;
  const delivery =
    params.delivery &&
    (Object.values(PostDeliveryType) as string[]).includes(params.delivery)
      ? (params.delivery as PostDeliveryType)
      : undefined;

  const titleHint =
    categorySlug === "tutorials"
      ? "Technology Tips"
      : categorySlug === "artificial-intelligence" || categorySlug === "technology-news"
        ? "AI News"
        : "Articles";

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(delivery ? { deliveryType: delivery } : {}),
      ...(categorySlug
        ? {
            categories: {
              some: {
                category: {
                  OR: [
                    { slug: categorySlug },
                    ...(categorySlug === "artificial-intelligence"
                      ? [{ slug: "technology-news" }, { slug: "ai-tools" }]
                      : []),
                    ...(categorySlug === "tutorials"
                      ? [{ slug: "computer-technology" }]
                      : []),
                  ],
                },
              },
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      author: { select: { name: true, email: true } },
      categories: { include: { category: true } },
      file: { select: { extension: true, sizeBytes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{titleHint}</h2>
          <p className="text-sm text-muted">
            {posts.length} results
            {categorySlug ? ` · category filter: ${categorySlug}` : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">New post</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3">
            <Input name="q" placeholder="Search title or slug" defaultValue={q} className="max-w-xs" />
            <Input
              name="category"
              placeholder="Category slug"
              defaultValue={categorySlug}
              className="max-w-xs"
            />
            <select
              name="status"
              defaultValue={status || ""}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">All statuses</option>
              {Object.values(PostStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="delivery"
              defaultValue={delivery || ""}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">All content types</option>
              {Object.values(PostDeliveryType).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Delivery</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-muted">
                      No posts found
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-surface-muted">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {post.title}
                        </Link>
                        <p className="text-xs text-muted">/{post.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${deliveryBadge(post.deliveryType)}`}
                        >
                          {post.deliveryType}
                          {post.file ? ` · .${post.file.extension}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-surface-muted px-2 py-0.5 text-xs">
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {post.author.name || post.author.email}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {format(post.updatedAt, "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
