import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import sanitizeHtml from "sanitize-html";
import { getPostBySlug } from "@/lib/queries/public";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article" };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Fire-and-forget view increment; ignore failures
  void prisma.post
    .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => undefined);

  const date = post.publishedAt ?? post.createdAt;
  const html = sanitizeHtml(post.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "span",
      "iframe",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height"],
      a: ["href", "name", "target", "rel"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder"],
      "*": ["class"],
    },
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-7 flex flex-wrap items-center gap-2 text-sm text-muted">
        {post.categories.map(({ category }) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="text-xs font-bold uppercase tracking-[0.16em] text-primary"
          >
            {category.name}
          </Link>
        ))}
        <time dateTime={date.toISOString()}>{format(date, "MMMM d, yyyy")}</time>
        <span aria-hidden>·</span>
        <span>{post.author.name || "Staff"}</span>
      </div>

      <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {post.title}
      </h1>
      <div className="mt-5 h-1 w-14 rounded-full bg-secondary" />

      {post.excerpt ? (
        <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">{post.excerpt}</p>
      ) : null}

      {post.featuredImage ? (
        <div className="mt-10 overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.featuredImage} alt="" className="w-full object-cover" />
        </div>
      ) : null}

      <div className="prose-tech mt-12" dangerouslySetInnerHTML={{ __html: html }} />

      {post.tags.length ? (
        <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-8">
          {post.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="border border-border px-3 py-1 text-xs font-medium text-muted"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
