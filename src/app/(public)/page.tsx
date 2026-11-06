import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/public/empty-state";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { PostCard } from "@/components/public/post-card";
import { Section } from "@/components/public/section";
import { SoftwareCard } from "@/components/public/software-card";
import { Button } from "@/components/ui/button";
import { getPublishedPosts, getPublishedSoftware } from "@/lib/queries/public";
import { getSiteSettings } from "@/lib/site";

export default async function HomePage() {
  const settings = await getSiteSettings();

  const [
    featuredNewsRaw,
    latestArticles,
    trendingSoftware,
    latestApksByOs,
    latestApksByCategory,
    tutorials,
  ] = await Promise.all([
    getPublishedPosts({ take: 4, featured: true, categorySlugs: ["technology-news"] }),
    getPublishedPosts({ take: 6 }),
    getPublishedSoftware({ take: 8, featured: true }),
    getPublishedSoftware({ take: 8, osIncludes: "android" }),
    getPublishedSoftware({ take: 8, categorySlugs: ["android-applications"] }),
    getPublishedPosts({ take: 5, categorySlugs: ["tutorials"] }),
  ]);

  let featuredNews = featuredNewsRaw;
  if (!featuredNews.length) {
    featuredNews = await getPublishedPosts({ take: 4, featured: true });
  }

  const apkMap = new Map(
    [...latestApksByOs, ...latestApksByCategory].map((item) => [item.id, item]),
  );
  const latestApks = Array.from(apkMap.values()).slice(0, 8);
  const leadStory = featuredNews[0] ?? latestArticles[0];
  const sideStories = (featuredNews.length ? featuredNews.slice(1) : latestArticles.slice(1)).slice(0, 3);

  return (
    <div className="w-full">
      {/* Full-bleed brand hero — no cards */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,var(--hero-from),var(--hero-via)_48%,var(--hero-to))] text-white">
        <div aria-hidden className="dt-hero-grid absolute inset-0 opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-secondary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8 lg:min-h-[78vh]">
          <p className="dt-animate-in text-xs font-bold uppercase tracking-[0.28em] text-secondary">
            {settings.tagline}
          </p>
          <h1 className="dt-animate-in dt-delay-1 mt-5 max-w-4xl font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
            {settings.platformName}
          </h1>
          <div className="dt-animate-in dt-delay-1 mt-6 h-1.5 w-24 rounded-full bg-secondary" />
          <p className="dt-animate-in dt-delay-2 mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            {settings.description ||
              "Technology news, AI discoveries, verified software downloads, and practical tutorials — every day."}
          </p>
          <div className="dt-animate-in dt-delay-3 mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="h-12 px-6 font-semibold">
              <Link href="/software">
                Browse software
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/25 bg-white/5 px-6 font-semibold text-white hover:bg-white/12"
            >
              <Link href="/news">Read the news</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-20 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Section
          eyebrow="Editorial"
          title="Featured stories"
          description="Lead coverage from the Daily Tips desk."
          href="/news"
        >
          {leadStory ? (
            <div className="grid gap-10 lg:grid-cols-[1.35fr_0.75fr] lg:gap-14">
              <PostCard post={leadStory} featured />
              <div className="divide-y divide-border border-t border-border lg:border-t-0 lg:border-l lg:pl-10">
                {sideStories.length ? (
                  sideStories.map((post) => <PostCard key={post.id} post={post} compact />)
                ) : (
                  <EmptyState title="More stories coming soon" />
                )}
              </div>
            </div>
          ) : (
            <EmptyState title="No featured news" description="Featured articles will appear here when published." />
          )}
        </Section>

        <Section
          eyebrow="Store"
          title="Trending software"
          description="Featured titles ready to explore and download."
          href="/software"
        >
          {trendingSoftware.length ? (
            <div className="dt-shelf pb-2">
              {trendingSoftware.map((item) => (
                <SoftwareCard key={item.id} software={item} shelf />
              ))}
            </div>
          ) : (
            <EmptyState title="No software listed" description="Published software will show up here." />
          )}
        </Section>

        <Section
          eyebrow="Feed"
          title="Latest articles"
          description="Fresh coverage across technology, AI, and tools."
          href="/news"
        >
          {latestArticles.length ? (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {latestArticles.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState title="No articles yet" />
          )}
        </Section>

        <Section
          eyebrow="Android"
          title="Latest APKs"
          description="Android apps and packages with clear verification status."
          href="/android"
        >
          {latestApks.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {latestApks.map((item) => (
                <SoftwareCard key={item.id} software={item} />
              ))}
            </div>
          ) : (
            <EmptyState title="No Android apps yet" />
          )}
        </Section>

        <Section
          eyebrow="Learn"
          title="Daily learning"
          description="Practical tutorials and how-to guides."
          href="/tutorials"
        >
          {tutorials.length ? (
            <div className="grid gap-0 md:grid-cols-2 md:gap-12">
              <div>
                {tutorials.slice(0, 1).map((post) => (
                  <PostCard key={post.id} post={post} featured />
                ))}
              </div>
              <div className="divide-y divide-border">
                {tutorials.slice(1).map((post) => (
                  <PostCard key={post.id} post={post} compact />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="No tutorials yet" />
          )}
        </Section>

        <section className="relative overflow-hidden border border-border bg-primary px-6 py-12 text-primary-foreground sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-secondary/30 blur-2xl"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-secondary">Newsletter</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Stay ahead of the stack
              </h2>
              <p className="mt-3 max-w-lg text-sm text-white/75">
                Product launches, security notes, and tutorial drops — delivered when they matter.
              </p>
            </div>
            <NewsletterForm className="[&_p]:text-white/60 [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-white/45" />
          </div>
        </section>
      </div>
    </div>
  );
}
