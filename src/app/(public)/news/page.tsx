import type { Metadata } from "next";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { PostCard } from "@/components/public/post-card";
import { getPublishedPosts } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "News",
  description: "Latest technology news and analysis.",
};

export default async function NewsPage() {
  let posts = await getPublishedPosts({ take: 24, categorySlugs: ["technology-news"] });
  if (!posts.length) {
    posts = await getPublishedPosts({ take: 24 });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow="Editorial"
        title="News"
        description="Coverage of launches, security, and industry shifts."
      />
      {posts.length ? (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState title="No news articles yet" />
      )}
    </div>
  );
}
