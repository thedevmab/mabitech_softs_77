import { PublicFooter } from "@/components/public/footer";
import { PublicHeader } from "@/components/public/header";
import { getSiteSettings } from "@/lib/site";

// Avoid build-time prerender against a live DB (CI/Vercel may not reach Postgres).
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <PublicHeader platformName={settings.platformName} logoUrl={settings.logoUrl} />
      <main className="flex-1">{children}</main>
      <PublicFooter settings={settings} />
    </div>
  );
}
