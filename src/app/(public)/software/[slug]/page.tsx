import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Smartphone,
} from "lucide-react";
import sanitizeHtml from "sanitize-html";
import { HostedDownloadButton } from "@/components/public/hosted-download-button";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { getSoftwareBySlug } from "@/lib/queries/public";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const software = await getSoftwareBySlug(slug);
  if (!software) return { title: "Software" };
  return {
    title: software.name,
    description: software.shortDescription || undefined,
  };
}

function VerificationPanel({
  status,
  verifiedAt,
}: {
  status: string;
  verifiedAt: Date | null;
}) {
  if (status === "VERIFIED") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="font-medium text-emerald-800 dark:text-emerald-200">Verified listing</p>
          <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">
            This package passed editorial verification
            {verifiedAt ? ` on ${verifiedAt.toLocaleDateString()}` : ""}. Verification reflects our
            review process — not that the software is installed on any device.
          </p>
        </div>
      </div>
    );
  }

  if (status === "INFECTED" || status === "REJECTED") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
        <div>
          <p className="font-medium text-red-800 dark:text-red-200">
            {status === "INFECTED" ? "Security flag" : "Rejected"}
          </p>
          <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">
            Downloads are restricted for this listing based on review findings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/60 p-4">
      <ShieldQuestion className="mt-0.5 h-5 w-5 text-muted" />
      <div>
        <p className="font-medium text-foreground">Unverified</p>
        <p className="mt-1 text-sm text-muted">
          This listing has not completed verification. Proceed carefully and prefer official sources
          when available.
        </p>
      </div>
    </div>
  );
}

export default async function SoftwareDetailPage({ params }: Props) {
  const { slug } = await params;
  const software = await getSoftwareBySlug(slug);
  if (!software) notFound();

  void prisma.software
    .update({ where: { id: software.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => undefined);

  const html = sanitizeHtml(software.description, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "span"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height"],
      a: ["href", "name", "target", "rel"],
      "*": ["class"],
    },
  });

  const latestVersion = software.versions.find((v) => v.isLatest) ?? software.versions[0];
  const canDownload = software.verificationStatus !== "INFECTED" && software.verificationStatus !== "REJECTED";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden border border-border bg-surface-muted shadow-[0_16px_40px_-28px_rgba(8,54,135,0.7)]">
              {software.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={software.iconUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-lg font-bold text-primary">
                  {software.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">Software</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                {software.name}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {software.developerName ? `${software.developerName} · ` : ""}
                {software.category ? (
                  <Link
                    href={`/categories/${software.category.slug}`}
                    className="text-primary hover:underline"
                  >
                    {software.category.name}
                  </Link>
                ) : (
                  "Uncategorized"
                )}
                {latestVersion ? ` · v${latestVersion.version}` : ""}
              </p>
              {software.shortDescription ? (
                <p className="mt-3 text-base text-muted">{software.shortDescription}</p>
              ) : null}
            </div>
          </div>

          {software.coverUrl || software.screenshots.length ? (
            <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
              {software.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={software.coverUrl}
                  alt=""
                  className="h-48 w-auto rounded-xl border border-border object-cover"
                />
              ) : null}
              {software.screenshots.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="h-48 w-auto rounded-xl border border-border object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="prose-tech mt-10" dangerouslySetInnerHTML={{ __html: html }} />

          {software.versions.length ? (
            <section className="mt-12 space-y-4">
              <h2 className="font-display text-2xl font-bold tracking-tight">Versions</h2>
              <ul className="space-y-3">
                {software.versions.map((version) => (
                  <li
                    key={version.id}
                    className="rounded-xl border border-border bg-surface px-4 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        v{version.version}
                        {version.isLatest ? (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                            Latest
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-muted">
                        {version.releaseDate.toLocaleDateString()}
                      </span>
                    </div>
                    {version.changelog ? (
                      <p className="mt-2 whitespace-pre-wrap text-muted">{version.changelog}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <VerificationPanel
            status={software.verificationStatus}
            verifiedAt={software.verifiedAt}
          />

          <div className="border border-border bg-surface p-5 shadow-[0_18px_40px_-32px_rgba(8,54,135,0.55)]">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-muted">Download</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Availability describes how you can obtain this software. This page does not install
              anything on your device.
            </p>

            <div className="mt-5 space-y-3">
              {software.channel === "HOSTED_FILE" ? (
                canDownload && software.files.length ? (
                  software.files.slice(0, 3).map((file) => (
                    <div
                      key={file.id}
                      className="rounded-xl border border-border bg-surface-muted/50 p-3"
                    >
                      <p className="truncate text-sm font-medium text-foreground">{file.originalName}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatBytes(file.sizeBytes)} · {file.extension.toUpperCase()} ·{" "}
                        {file.verificationStatus}
                      </p>
                      <HostedDownloadButton slug={software.slug} fileId={file.id} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    {canDownload
                      ? "No hosted files are available for this listing yet."
                      : "Hosted downloads are unavailable for this listing."}
                  </p>
                )
              ) : null}

              {software.channel === "EXTERNAL_URL" ? (
                software.externalUrl && canDownload ? (
                  <Button asChild className="w-full">
                    <a href={software.externalUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open external download
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted">External download link is not available.</p>
                )
              ) : null}

              {software.channel === "GOOGLE_PLAY" ? (
                software.googlePlayUrl && canDownload ? (
                  <Button asChild className="w-full">
                    <a href={software.googlePlayUrl} target="_blank" rel="noopener noreferrer">
                      <Smartphone className="h-4 w-4" />
                      View on Google Play
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted">Google Play link is not available.</p>
                )
              ) : null}

              {/* Also surface alternate official links when present */}
              {software.channel !== "EXTERNAL_URL" && software.externalUrl ? (
                <Button asChild variant="outline" className="w-full border-border text-foreground">
                  <a href={software.externalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Official website / source
                  </a>
                </Button>
              ) : null}
              {software.channel !== "GOOGLE_PLAY" && software.googlePlayUrl ? (
                <Button asChild variant="outline" className="w-full border-border text-foreground">
                  <a href={software.googlePlayUrl} target="_blank" rel="noopener noreferrer">
                    <Smartphone className="h-4 w-4" />
                    Google Play listing
                  </a>
                </Button>
              ) : null}
            </div>

            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Channel</dt>
                <dd className="font-medium text-foreground">{software.channel.replaceAll("_", " ")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Downloads</dt>
                <dd className="font-medium text-foreground">
                  {software.downloadCount.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">License</dt>
                <dd className="font-medium text-foreground">
                  {software.isPremium ? "Premium" : software.isFree ? "Free" : "Paid"}
                </dd>
              </div>
              {software.supportedOs.length ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Platforms</dt>
                  <dd className="text-right font-medium text-foreground">
                    {software.supportedOs.join(", ")}
                  </dd>
                </div>
              ) : null}
              {software.minAndroidVersion ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Min Android</dt>
                  <dd className="font-medium text-foreground">{software.minAndroidVersion}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
