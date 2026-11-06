"use client";

import { useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileDropzone, type UploadedPostFile } from "@/components/admin/file-dropzone";
import { FeaturedImageField } from "@/components/admin/featured-image-field";
import { formatBytes } from "@/lib/utils";

function clientSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type CategoryOption = { id: string; name: string };

export type PostFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  status: string;
  scheduledAt: string;
  isFeatured: boolean;
  isSponsored: boolean;
  categoryIds: string[];
  tags: string;
  deliveryType: "NONE" | "FILE" | "LINK";
  externalUrl: string;
  linkDescription: string;
  version: string;
  publisher: string;
  releaseDate: string;
  file: UploadedPostFile | null;
};

type Props = {
  categories: CategoryOption[];
  initial?: Partial<PostFormValues>;
  action: (formData: FormData) => Promise<void>;
  submitLabel?: string;
};

const DELIVERY_OPTIONS: Array<{
  value: PostFormValues["deliveryType"];
  label: string;
  hint: string;
}> = [
  { value: "NONE", label: "Normal content", hint: "Article only — no download button" },
  { value: "FILE", label: "File upload", hint: "APK, ZIP, PDF, documents" },
  { value: "LINK", label: "External link", hint: "Shows GET NOW in the app" },
];

function actionPreview(params: {
  deliveryType: PostFormValues["deliveryType"];
  file: UploadedPostFile | null;
}) {
  if (params.deliveryType === "LINK") return "GET NOW";
  if (params.deliveryType === "FILE") {
    if (params.file?.extension?.toLowerCase() === "apk") return "DOWNLOAD APK";
    return "DOWNLOAD";
  }
  return null;
}

export function PostForm({ categories, initial, action, submitLabel = "Save" }: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage || "");
  const [deliveryType, setDeliveryType] = useState<PostFormValues["deliveryType"]>(
    initial?.deliveryType || "NONE",
  );
  const [file, setFile] = useState<UploadedPostFile | null>(initial?.file || null);
  const [externalUrl, setExternalUrl] = useState(initial?.externalUrl || "");
  const [linkDescription, setLinkDescription] = useState(initial?.linkDescription || "");
  const [version, setVersion] = useState(initial?.version || "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const previewButton = useMemo(
    () => actionPreview({ deliveryType, file }),
    [deliveryType, file],
  );

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(clientSlug(value));
  }

  function validateUrl(value: string) {
    if (!value.trim()) {
      setUrlError(null);
      return;
    }
    try {
      const u = new URL(value);
      if (u.protocol !== "https:" && u.protocol !== "http:") {
        setUrlError("Only http(s) URLs are allowed");
      } else if (u.username || u.password) {
        setUrlError("URLs with credentials are not allowed");
      } else {
        setUrlError(null);
      }
    } catch {
      setUrlError("Invalid URL");
    }
  }

  function onSubmit(formData: FormData) {
    setError(null);
    if (deliveryType === "FILE" && !file?.id) {
      setError("Upload a file before saving a file post");
      return;
    }
    if (deliveryType === "LINK") {
      if (!externalUrl.trim()) {
        setError("External URL is required for link posts");
        return;
      }
      if (urlError) {
        setError(urlError);
        return;
      }
    }
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
    <form action={onSubmit} className="space-y-8">
      {error ? (
        <div className="rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Post information
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
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
          <Label htmlFor="excerpt">Short description</Label>
          <Textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Full description</Label>
          <Textarea
            id="content"
            name="content"
            rows={12}
            required
            defaultValue={initial?.content}
            className="font-mono text-xs sm:text-sm"
          />
          <p className="text-xs text-muted">HTML allowed; content is sanitized on save.</p>
        </div>

        <FeaturedImageField value={featuredImage} onChange={setFeaturedImage} />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="version">Version number</Label>
            <Input
              id="version"
              name="version"
              placeholder="Optional"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publisher">Developer / publisher</Label>
            <Input
              id="publisher"
              name="publisher"
              placeholder="Optional"
              defaultValue={initial?.publisher}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="releaseDate">Release date</Label>
            <Input
              id="releaseDate"
              name="releaseDate"
              type="date"
              defaultValue={initial?.releaseDate}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Content delivery
        </h3>
        <input type="hidden" name="deliveryType" value={deliveryType} />
        <div className="grid gap-2 sm:grid-cols-3">
          {DELIVERY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDeliveryType(opt.value)}
              className={`rounded-lg border px-3 py-3 text-left transition ${
                deliveryType === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface/40 hover:border-primary/40"
              }`}
            >
              <p className="text-sm font-medium text-foreground">{opt.label}</p>
              <p className="mt-1 text-xs text-muted">{opt.hint}</p>
            </button>
          ))}
        </div>

        {deliveryType === "FILE" ? (
          <FileDropzone
            value={file}
            onChange={setFile}
            onApkVersion={(v) => {
              if (!version) setVersion(v);
            }}
          />
        ) : null}

        {deliveryType === "LINK" ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface/40 p-4">
            <div className="space-y-2">
              <Label htmlFor="externalUrl">External URL</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="externalUrl"
                  name="externalUrl"
                  type="url"
                  placeholder="https://…"
                  value={externalUrl}
                  onChange={(e) => {
                    setExternalUrl(e.target.value);
                    validateUrl(e.target.value);
                  }}
                  required={deliveryType === "LINK"}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!externalUrl || Boolean(urlError)}
                  onClick={() =>
                    window.open(externalUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  Test link
                </Button>
              </div>
              {urlError ? <p className="text-xs text-red-400">{urlError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkDescription">Link description</Label>
              <Input
                id="linkDescription"
                name="linkDescription"
                placeholder="Optional"
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <>
            <input type="hidden" name="externalUrl" value="" />
            <input type="hidden" name="linkDescription" value="" />
          </>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Taxonomy &amp; SEO
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input id="seoTitle" name="seoTitle" defaultValue={initial?.seoTitle} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input id="keywords" name="keywords" defaultValue={initial?.keywords} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="seoDescription">SEO description</Label>
          <Textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            defaultValue={initial?.seoDescription}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" name="tags" defaultValue={initial?.tags} />
        </div>
        <div className="space-y-2">
          <Label>Categories</Label>
          <div className="grid gap-2 rounded-md border border-border bg-surface/60 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={c.id}
                  defaultChecked={initial?.categoryIds?.includes(c.id)}
                  className="rounded border-border"
                />
                {c.name}
              </label>
            ))}
            {categories.length === 0 ? (
              <p className="text-sm text-muted">No categories available</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Publish</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={initial?.status || "DRAFT"}
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Scheduled at</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              defaultValue={initial?.scheduledAt}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={initial?.isFeatured}
              className="rounded border-border"
            />
            Featured post
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="isSponsored"
              defaultChecked={initial?.isSponsored}
              className="rounded border-border"
            />
            Sponsored
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface/40 p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Mobile preview</h3>
        <div className="mx-auto max-w-sm overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          {featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={featuredImage} alt="" className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-xs tracking-widest text-muted">
              DAILY TIPS
            </div>
          )}
          <div className="space-y-2 p-4">
            <div className="flex flex-wrap gap-2">
              {file ? (
                <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  {file.extension}
                </span>
              ) : null}
              {file ? (
                <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] text-muted">
                  {formatBytes(Number(file.sizeBytes))}
                </span>
              ) : null}
              {deliveryType === "LINK" ? (
                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
                  External
                </span>
              ) : null}
            </div>
            <p className="text-sm font-semibold leading-snug text-foreground">
              {title || "Post title"}
            </p>
            <p className="line-clamp-2 text-xs text-muted">
              {excerpt || "Short description appears here."}
            </p>
            {previewButton ? (
              <button
                type="button"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground"
              >
                {previewButton}
              </button>
            ) : (
              <p className="mt-2 text-[11px] italic text-muted">No action button</p>
            )}
          </div>
        </div>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
