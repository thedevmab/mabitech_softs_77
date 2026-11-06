import Link from "next/link";
import { getSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
              {settings.platformName.slice(0, 1).toUpperCase()}
            </span>
            {settings.platformName}
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-primary dark:hover:text-primary">
            Back to site
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
