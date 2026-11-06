"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/news", label: "News" },
  { href: "/software", label: "Software" },
  { href: "/ai", label: "AI" },
  { href: "/tutorials", label: "Tutorials" },
];

const MORE_NAV = [
  { href: "/android", label: "Android" },
  { href: "/windows", label: "Windows" },
  { href: "/categories", label: "Categories" },
  { href: "/premium", label: "Premium" },
];

const MOBILE_NAV = [...PRIMARY_NAV, ...MORE_NAV];

export function PublicHeader({
  platformName,
  logoUrl,
}: {
  platformName: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = MORE_NAV.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-9 w-9 rounded-md object-contain" />
            ) : (
              <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-[0_8px_24px_-12px_rgba(8,54,135,0.8)]">
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1 bg-secondary"
                />
                {platformName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="font-display text-lg font-bold tracking-tight text-foreground transition group-hover:text-primary">
              {platformName}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {PRIMARY_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm font-semibold tracking-wide transition",
                    active
                      ? "text-primary"
                      : "text-muted hover:bg-surface-muted/80 hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-3 -bottom-[0.9rem] h-0.5 rounded-full bg-secondary" />
                  ) : null}
                </Link>
              );
            })}
            <div className="group relative">
              <button
                type="button"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-semibold tracking-wide transition",
                  moreActive
                    ? "text-primary"
                    : "text-muted hover:bg-surface-muted/80 hover:text-foreground",
                )}
              >
                More
              </button>
              <div className="invisible absolute left-0 top-full z-50 min-w-[11rem] translate-y-1 rounded-xl border border-border bg-surface p-2 opacity-0 shadow-xl shadow-primary/5 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                {MORE_NAV.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm font-medium",
                        active
                          ? "bg-secondary/15 text-primary"
                          : "text-muted hover:bg-surface-muted hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden text-foreground sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="hidden font-semibold sm:inline-flex">
            <Link href="/register">Join</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background xl:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {MOBILE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/login" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button asChild variant="secondary" className="flex-1">
                <Link href="/register" onClick={() => setOpen(false)}>
                  Join
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
