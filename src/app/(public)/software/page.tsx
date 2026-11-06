import type { Metadata } from "next";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { SoftwareCard } from "@/components/public/software-card";
import { getPublishedSoftware } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Software",
  description: "Browse published software with verification and download details.",
};

export default async function SoftwarePage() {
  const items = await getPublishedSoftware({ take: 36, orderByDownloads: true });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow="Catalog"
        title="Software"
        description="Verified listings with clear distribution channels — hosted files, external links, or Google Play."
      />
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SoftwareCard key={item.id} software={item} />
          ))}
        </div>
      ) : (
        <EmptyState title="No software published yet" />
      )}
    </div>
  );
}
