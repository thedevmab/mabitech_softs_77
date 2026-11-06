import type { Metadata } from "next";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { PostCard } from "@/components/public/post-card";
import { SoftwareCard } from "@/components/public/software-card";
import { getPublishedPosts, getPublishedSoftware } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "AI",
  description: "AI tools, models, and related articles.",
};

export default async function AiPage() {
  const [tools, posts] = await Promise.all([
    getPublishedSoftware({ take: 24, categorySlugs: ["ai-tools", "artificial-intelligence"] }),
    getPublishedPosts({ take: 12, categorySlugs: ["artificial-intelligence", "ai-tools"] }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow="Intelligence"
        title="AI"
        description="Tools and stories from the artificial intelligence space."
      />

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">AI tools</h2>
        {tools.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((item) => (
              <SoftwareCard key={item.id} software={item} />
            ))}
          </div>
        ) : (
          <EmptyState title="No AI tools yet" />
        )}
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">AI articles</h2>
        {posts.length ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState title="No AI articles yet" />
        )}
      </section>
    </div>
  );
}
