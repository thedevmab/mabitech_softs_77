"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

const TITLES: Record<string, string> = {
  "/admin": "Overview",
  "/admin/posts": "Articles",
  "/admin/software": "Software Downloads",
  "/admin/categories": "Categories",
  "/admin/homepage": "Homepage Manager",
  "/admin/users": "Users",
  "/admin/ads": "Advertisements",
  "/admin/monetization": "Monetization / AdMob Settings",
  "/admin/subscriptions": "Premium Subscriptions",
  "/admin/affiliates": "Affiliates",
  "/admin/sponsored": "Sponsored campaigns",
  "/admin/notifications": "Notifications",
  "/admin/analytics": "Analytics",
  "/admin/reports": "Reports",
  "/admin/settings": "App Settings",
  "/admin/health": "API & Integration Health",
  "/admin/audit-logs": "Audit Logs",
  "/admin/api-docs": "API documentation",
};

function resolveTitle(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES)
    .filter((k) => k !== "/admin" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  if (match === "/admin/posts" && pathname.includes("/new")) return "New post";
  if (match === "/admin/posts") return "Edit post";
  if (match === "/admin/software" && pathname.includes("/new")) return "New software";
  if (match === "/admin/software") return "Edit software";
  return match ? TITLES[match] : "Admin";
}

type ShellProps = {
  userName?: string | null;
  userEmail?: string | null;
  children: React.ReactNode;
};

export function AdminShell({ userName, userEmail, children }: ShellProps) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const pathname = usePathname();

  function handleSignOut() {
    startTransition(() => {
      window.location.assign("/admin/sign-out");
    });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          title={resolveTitle(pathname)}
          userName={userName}
          userEmail={userEmail}
          onMenuClick={() => setOpen(true)}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 overflow-x-hidden bg-surface-muted/40 p-4 sm:p-6 dark:bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
