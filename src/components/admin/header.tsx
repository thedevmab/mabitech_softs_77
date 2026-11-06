"use client";

import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  title?: string;
  userEmail?: string | null;
  userName?: string | null;
  onMenuClick: () => void;
  onSignOut: () => void;
};

export function AdminHeader({
  title = "Dashboard",
  userEmail,
  userName,
  onMenuClick,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">{title}</h1>
      </div>
      <div className="hidden text-right sm:block">
        <p className="truncate text-sm text-foreground">{userName || "Admin"}</p>
        <p className="truncate text-xs text-muted">{userEmail}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onSignOut}>
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </header>
  );
}
