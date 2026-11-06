import type { Metadata } from "next";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { SoftwareCard } from "@/components/public/software-card";
import { getPublishedSoftware } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Android",
  description: "Android applications and APK listings.",
};

export default async function AndroidPage() {
  const [byOs, byCategory] = await Promise.all([
    getPublishedSoftware({ take: 36, osIncludes: "android" }),
    getPublishedSoftware({ take: 36, categorySlugs: ["android-applications"] }),
  ]);
  const items = Array.from(new Map([...byOs, ...byCategory].map((i) => [i.id, i])).values());

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow="Mobile"
        title="Android"
        description="APKs and Android apps. Download availability depends on channel and verification — we never claim apps are installed."
      />
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SoftwareCard key={item.id} software={item} />
          ))}
        </div>
      ) : (
        <EmptyState title="No Android apps yet" />
      )}
    </div>
  );
}
