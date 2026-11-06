"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function clientSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type SoftwareFormValues = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  iconUrl: string;
  coverUrl: string;
  developerName: string;
  officialWebsite: string;
  categoryId: string;
  supportedOs: string;
  minAndroidVersion: string;
  channel: string;
  externalUrl: string;
  googlePlayUrl: string;
  isFree: boolean;
  isPremium: boolean;
  isFeatured: boolean;
  status: string;
  screenshots: string;
  affiliateCampaignId: string;
};

type Props = {
  categories: { id: string; name: string }[];
  affiliates: { id: string; name: string }[];
  initial?: Partial<SoftwareFormValues>;
  action: (formData: FormData) => Promise<void>;
  submitLabel?: string;
};

export function SoftwareForm({
  categories,
  affiliates,
  initial,
  action,
  submitLabel = "Save",
}: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (e) {
        if (e && typeof e === "object" && "digest" in e) throw e;
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(clientSlug(e.target.value));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short description</Label>
        <Input
          id="shortDescription"
          name="shortDescription"
          defaultValue={initial?.shortDescription}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={10}
          required
          defaultValue={initial?.description}
          className="font-mono text-sm"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="iconUrl">Icon URL</Label>
          <Input id="iconUrl" name="iconUrl" type="url" defaultValue={initial?.iconUrl} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coverUrl">Cover URL</Label>
          <Input id="coverUrl" name="coverUrl" type="url" defaultValue={initial?.coverUrl} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="developerName">Developer</Label>
          <Input
            id="developerName"
            name="developerName"
            defaultValue={initial?.developerName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="officialWebsite">Official website</Label>
          <Input
            id="officialWebsite"
            name="officialWebsite"
            type="url"
            defaultValue={initial?.officialWebsite}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={initial?.categoryId || ""}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="channel">Distribution channel</Label>
          <select
            id="channel"
            name="channel"
            defaultValue={initial?.channel || "HOSTED_FILE"}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="HOSTED_FILE">Hosted file</option>
            <option value="EXTERNAL_URL">External URL</option>
            <option value="GOOGLE_PLAY">Google Play</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status || "DRAFT"}
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="externalUrl">External URL</Label>
          <Input
            id="externalUrl"
            name="externalUrl"
            type="url"
            defaultValue={initial?.externalUrl}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="googlePlayUrl">Google Play URL</Label>
          <Input
            id="googlePlayUrl"
            name="googlePlayUrl"
            type="url"
            defaultValue={initial?.googlePlayUrl}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supportedOs">Supported OS (comma-separated)</Label>
          <Input
            id="supportedOs"
            name="supportedOs"
            defaultValue={initial?.supportedOs || "Android, Windows"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minAndroidVersion">Min Android version</Label>
          <Input
            id="minAndroidVersion"
            name="minAndroidVersion"
            defaultValue={initial?.minAndroidVersion}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="screenshots">Screenshot URLs (comma-separated)</Label>
        <Textarea
          id="screenshots"
          name="screenshots"
          rows={2}
          defaultValue={initial?.screenshots}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="affiliateCampaignId">Affiliate campaign</Label>
        <select
          id="affiliateCampaignId"
          name="affiliateCampaignId"
          defaultValue={initial?.affiliateCampaignId || ""}
          className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
        >
          <option value="">None</option>
          {affiliates.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFree" defaultChecked={initial?.isFree ?? true} />
          Free
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPremium" defaultChecked={initial?.isPremium} />
          Premium
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured} />
          Featured
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
