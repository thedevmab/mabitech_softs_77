import Link from "next/link";
import { format } from "date-fns";
import type { PostCardData } from "@/lib/queries/public";
import { cn } from "@/lib/utils";

export function PostCard({
  post,
  featured = false,
  compact = false,
  className,
}: {
  post: PostCardData;
  featured?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const category = post.categories[0]?.category;
  const date = post.publishedAt ?? post.createdAt;

  if (compact) {
    return (
      <article className={cn("group border-b border-border py-4 last:border-b-0", className)}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {category ? <span className="font-semibold text-primary">{category.name}</span> : null}
          <time dateTime={date.toISOString()}>{format(date, "MMM d, yyyy")}</time>
        </div>
        <h3 className="mt-1.5 font-display text-lg font-bold tracking-tight text-foreground">
          <Link href={`/posts/${post.slug}`} className="transition hover:text-primary">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-muted">{post.excerpt}</p> : null}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden bg-transparent",
        featured && "md:flex-row md:gap-8",
        className,
      )}
    >
      <Link
        href={`/posts/${post.slug}`}
        className={cn(
          "relative block overflow-hidden bg-surface-muted",
          featured ? "md:w-[46%] md:min-h-[280px]" : "aspect-[16/10]",
        )}
      >
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImage}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full min-h-[160px] items-end bg-gradient-to-br from-[#05275f] via-primary to-[#0a4499] p-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/70">
              Daily Tips
            </span>
          </div>
        )}
        <span className="absolute left-0 top-0 h-full w-1 bg-secondary opacity-0 transition group-hover:opacity-100" />
      </Link>

      <div className={cn("flex flex-1 flex-col gap-3 pt-4", featured && "md:py-2")}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {category ? (
            <Link
              href={`/categories/${category.slug}`}
              className="font-bold uppercase tracking-[0.14em] text-primary"
            >
              {category.name}
            </Link>
          ) : null}
          <time dateTime={date.toISOString()}>{format(date, "MMM d, yyyy")}</time>
          {post.isSponsored ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">
              Sponsored
            </span>
          ) : null}
        </div>

        <h3
          className={cn(
            "font-display font-bold tracking-tight text-foreground transition group-hover:text-primary",
            featured ? "text-3xl leading-tight sm:text-4xl" : "text-xl",
          )}
        >
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h3>

        {post.excerpt ? (
          <p className={cn("leading-relaxed text-muted", featured ? "text-base" : "line-clamp-3 text-sm")}>
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-2 text-xs font-medium text-muted">
          <span>{post.author.name || "Staff"}</span>
          <span aria-hidden>·</span>
          <span>{post.viewCount.toLocaleString()} views</span>
        </div>
      </div>
    </article>
  );
}
