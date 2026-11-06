import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Section({
  title,
  description,
  href,
  children,
  className,
  eyebrow,
}: {
  title: string;
  description?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
  eyebrow?: string;
}) {
  return (
    <section className={cn("space-y-7", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-secondary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          {description ? <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{description}</p> : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-secondary dark:hover:text-secondary"
          >
            View all
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
