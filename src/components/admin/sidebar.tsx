"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Bot,
  Sparkles,
  Package,
  FolderTree,
  LayoutGrid,
  Users,
  CreditCard,
  Bell,
  Megaphone,
  BarChart3,
  Settings,
  Activity,
  ScrollText,
  Flag,
  BookOpen,
  Link2,
  BadgeDollarSign,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Articles", icon: FileText },
  {
    href: "/admin/posts?category=tutorials",
    label: "Technology Tips",
    icon: Lightbulb,
    match: "/admin/posts",
  },
  {
    href: "/admin/posts?category=artificial-intelligence",
    label: "AI News",
    icon: Bot,
    match: "/admin/posts",
  },
  {
    href: "/admin/software?category=ai-tools",
    label: "AI Tools",
    icon: Sparkles,
    match: "/admin/software",
  },
  { href: "/admin/software", label: "Software Downloads", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/homepage", label: "Homepage Manager", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Premium Subscriptions", icon: CreditCard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/ads", label: "Advertisements", icon: Megaphone },
  { href: "/admin/monetization", label: "Monetization / AdMob Settings", icon: BadgeDollarSign },
  { href: "/admin/sponsored", label: "Sponsored", icon: BadgeDollarSign },
  { href: "/admin/affiliates", label: "Affiliates", icon: Link2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/settings", label: "App Settings", icon: Settings },
  { href: "/admin/health", label: "API & Integration Health", icon: Activity },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/api-docs", label: "API Docs", icon: BookOpen },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminSidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-primary text-primary-foreground transition-transform lg:static lg:translate-x-0 dark:bg-[#083687]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-bold text-secondary-foreground">
              DT
            </span>
            <span className="font-semibold tracking-tight">Daily Tips</span>
          </Link>
          <button
            type="button"
            className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map((item) => {
            const base = item.match || item.href.split("?")[0];
            const active =
              base === "/admin"
                ? pathname === "/admin"
                : pathname === base || pathname.startsWith(`${base}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-white/60">
          Daily Tips Admin
        </div>
      </aside>
    </>
  );
}
