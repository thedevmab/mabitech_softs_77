"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function DateRangeFilter({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(formData: FormData) {
    const next = new URLSearchParams(searchParams.toString());
    const f = String(formData.get("from") || "");
    const t = String(formData.get("to") || "");
    if (f) next.set("from", f);
    else next.delete("from");
    if (t) next.set("to", t);
    else next.delete("to");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  return (
    <form action={apply} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-muted p-3">
      <div className="space-y-1">
        <Label htmlFor="from">From</Label>
        <Input id="from" name="from" type="date" defaultValue={from} className="w-40" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to">To</Label>
        <Input id="to" name="to" type="date" defaultValue={to} className="w-40" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Applying…" : "Apply range"}
      </Button>
    </form>
  );
}
