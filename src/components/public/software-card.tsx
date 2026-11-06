import Link from "next/link";
import { Download, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { SoftwareCardData } from "@/lib/queries/public";
import { cn } from "@/lib/utils";

function VerificationBadge({ status }: { status: SoftwareCardData["verificationStatus"] }) {
  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="h-3 w-3" />
        Verified
      </span>
    );
  }
  if (status === "INFECTED" || status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
        <ShieldAlert className="h-3 w-3" />
        {status === "INFECTED" ? "Flagged" : "Rejected"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted/15 px-2 py-0.5 text-[11px] font-semibold text-muted">
      <ShieldQuestion className="h-3 w-3" />
      Unverified
    </span>
  );
}

export function SoftwareCard({
  software,
  className,
  shelf = false,
}: {
  software: SoftwareCardData;
  className?: string;
  shelf?: boolean;
}) {
  const version = software.versions[0]?.version;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col border border-border bg-surface p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_40px_-28px_rgba(8,54,135,0.55)]",
        shelf && "min-h-[210px]",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-secondary transition duration-300 group-hover:scale-x-100"
      />

      <div className="flex items-start gap-3.5">
        <Link
          href={`/software/${software.slug}`}
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-border bg-surface-muted"
        >
          {software.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={software.iconUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-sm font-bold text-primary">
              {software.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-base font-bold tracking-tight text-foreground">
              <Link href={`/software/${software.slug}`} className="hover:text-primary">
                {software.name}
              </Link>
            </h3>
            <VerificationBadge status={software.verificationStatus} />
          </div>
          <p className="mt-1 text-xs font-medium text-muted">
            {software.category?.name ?? "Software"}
            {version ? ` · v${version}` : ""}
            {software.isPremium ? " · Premium" : software.isFree ? " · Free" : ""}
          </p>
        </div>
      </div>

      {software.shortDescription ? (
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted">{software.shortDescription}</p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Download className="h-3.5 w-3.5" />
          {software.downloadCount.toLocaleString()}
        </span>
        <Link
          href={`/software/${software.slug}`}
          className="font-semibold text-primary transition hover:text-secondary"
        >
          Get details
        </Link>
      </div>
    </article>
  );
}
