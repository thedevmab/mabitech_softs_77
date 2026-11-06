import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-secondary/40 bg-secondary/15 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground dark:text-secondary",
        className,
      )}
      {...props}
    />
  );
}
