import type { Metadata } from "next";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { PostCard } from "@/components/public/post-card";
import { getPublishedPosts } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Tutorials",
  description: "Step-by-step technology tutorials and guides.",
};

export default async function TutorialsPage() {
  const posts = await getPublishedPosts({ take: 24, categorySlugs: ["tutorials"] });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow="Learn"
        title="Tutorials"
        description="Practical how-tos from our editorial team."
      />
      {posts.length ? (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState title="No tutorials yet" />
      )}
    </div>
  );
}
