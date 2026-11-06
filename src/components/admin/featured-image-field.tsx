"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export function FeaturedImageField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function upload(file: File) {
    setError(null);
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.set("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/posts/images");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploading(false);
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          onChange(json.data.url as string);
        } else {
          setError(json?.error?.message || "Image upload failed");
        }
      } catch {
        setError("Image upload failed");
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError("Network error during image upload");
    };
    xhr.send(fd);
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="featuredImage">Featured image</Label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="featuredImage"
          name="featuredImage"
          type="url"
          placeholder="https://… or upload below"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? `${progress}%` : "Upload"}
        </Button>
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="Featured preview"
          className="h-40 w-full max-w-md rounded-md border border-border object-cover"
        />
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
