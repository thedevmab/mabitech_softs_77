import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { PostCard } from "@/components/public/post-card";
import { SoftwareCard } from "@/components/public/software-card";
import {
  getCategoryBySlug,
  getPublishedPosts,
  getPublishedSoftware,
} from "@/lib/queries/public";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description: category.description || `Browse ${category.name} on the platform.`,
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [posts, software] = await Promise.all([
    getPublishedPosts({ take: 24, categorySlugs: [category.slug] }),
    getPublishedSoftware({ take: 24, categorySlugs: [category.slug] }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={category.name} description={category.description || undefined} />

      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Articles</h2>
        {posts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState title="No articles in this category" />
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Software</h2>
        {software.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {software.map((item) => (
              <SoftwareCard key={item.id} software={item} />
            ))}
          </div>
        ) : (
          <EmptyState title="No software in this category" />
        )}
      </section>
    </div>
  );
}
