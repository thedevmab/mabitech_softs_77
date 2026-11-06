"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
};

export function AuthForm({
  title,
  description,
  fields,
  submitLabel,
  action,
  footer,
  hiddenFields,
  onSuccessRedirect,
}: {
  title: string;
  description?: string;
  fields: Field[];
  submitLabel: string;
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  footer?: React.ReactNode;
  hiddenFields?: Record<string, string>;
  onSuccessRedirect?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (hiddenFields) {
      for (const [key, value] of Object.entries(hiddenFields)) {
        formData.set(key, value);
      }
    }

    startTransition(async () => {
      setError(null);
      const result = await action(formData);
      if (!result.ok) {
        setError(result.message || "Something went wrong.");
        toast.error(result.message || "Something went wrong.");
        return;
      }
      if (result.message) toast.success(result.message);
      if (onSuccessRedirect) {
        // Full navigation so the Auth.js session cookie is picked up reliably
        // (soft client navigations can bounce admin back to /login).
        window.location.assign(onSuccessRedirect);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-foreground">
              {field.label}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type || "text"}
              autoComplete={field.autoComplete}
              required={field.required !== false}
              placeholder={field.placeholder}
              className="border-border bg-background text-foreground placeholder:text-muted"
              disabled={pending}
            />
          </div>
        ))}

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Please wait…" : submitLabel}
        </Button>
      </form>

      {footer ? <div className="mt-6 text-sm text-muted">{footer}</div> : null}
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary hover:underline dark:text-primary">
      {children}
    </Link>
  );
}
