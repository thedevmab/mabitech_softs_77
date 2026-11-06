"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/app/(public)/actions";

export function NewsletterForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await subscribeNewsletter(email);
      if (result.ok) {
        toast.success(result.message);
        setEmail("");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-border bg-background text-foreground placeholder:text-muted"
          disabled={pending}
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">No spam. Unsubscribe anytime.</p>
    </form>
  );
}
