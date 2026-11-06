import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { getCategories } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse content and software by category.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Categories" description="Explore topics across articles and software." />
      {categories.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{category.name}</h2>
              {category.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted">{category.description}</p>
              ) : null}
              <p className="mt-4 text-xs text-muted">
                {category._count.posts} articles · {category._count.software} software
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No categories yet" />
      )}
    </div>
  );
}
