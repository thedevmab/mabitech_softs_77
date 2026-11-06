import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title={`About ${settings.platformName}`} />
      <p className="mb-6 text-sm font-medium uppercase tracking-[0.18em] text-secondary">
        {settings.tagline}
      </p>
      <div className="space-y-4 text-base leading-relaxed text-muted">
        <p>
          {settings.description ||
            `${settings.platformName} is your daily destination for technology news, AI discoveries, software downloads, and useful resources.`}
        </p>
        <p>
          We publish news, tutorials, and curated software listings with clear verification status
          and distribution channels. Our goal is to help readers discover trustworthy tools without
          misleading installation claims.
        </p>
        <p>
          Content spans artificial intelligence, Android and Windows software, cybersecurity,
          productivity, and developer education.
        </p>
      </div>
    </div>
  );
}
