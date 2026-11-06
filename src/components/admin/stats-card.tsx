import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
};

export function StatsCard({ title, value, subtitle, icon: Icon, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-gradient-to-br from-surface to-surface-muted p-5 shadow-lg shadow-black/5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">{title}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
