"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";

export type UploadedPostFile = {
  id: string;
  originalName: string;
  extension: string;
  mimeType: string;
  sizeBytes: string | number;
  checksumSha256: string;
  scanResult?: string | null;
  scanSkipped?: boolean;
  isApk?: boolean;
  apk?: {
    packageName?: string | null;
    versionName?: string | null;
    versionCode?: number | null;
    minSdkVersion?: number | null;
  } | null;
};

type Props = {
  value: UploadedPostFile | null;
  onChange: (file: UploadedPostFile | null) => void;
  onApkVersion?: (versionName: string) => void;
};

const ACCEPT =
  ".apk,.aab,.zip,.rar,.7z,.pdf,.doc,.docx,.xls,.xlsx,.pptx,.txt,.csv";

export function FileDropzone({ value, onChange, onApkVersion }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    (file: File) => {
      setError(null);
      setUploading(true);
      setProgress(0);

      const fd = new FormData();
      fd.set("file", file);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("POST", "/api/admin/posts/files");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        setUploading(false);
        xhrRef.current = null;
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = json.data as UploadedPostFile;
            onChange(data);
            if (data.isApk && data.apk?.versionName && onApkVersion) {
              onApkVersion(data.apk.versionName);
            }
            setProgress(100);
          } else {
            setError(json?.error?.message || "Upload failed");
          }
        } catch {
          setError("Upload failed");
        }
      };
      xhr.onerror = () => {
        setUploading(false);
        xhrRef.current = null;
        setError("Network error during upload");
      };
      xhr.send(fd);
    },
    [onChange, onApkVersion],
  );

  function cancelUpload() {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setUploading(false);
    setProgress(0);
  }

  async function removeFile() {
    if (!value) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts/files/${value.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || "Could not remove file");
        return;
      }
      onChange(null);
      setProgress(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove file");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="fileId" value={value?.id || ""} />

      {!value ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition ${
            dragOver
              ? "border-primary bg-primary/10"
              : "border-border bg-surface/40"
          }`}
        >
          <p className="text-sm font-medium text-foreground">
            Drag & drop a file here, or browse
          </p>
          <p className="text-xs text-muted">
            APK, ZIP, PDF, DOC, DOCX, XLSX and other approved formats
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
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
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? `Uploading… ${progress}%` : "Browse files"}
          </Button>
          {uploading ? (
            <div className="mt-2 w-full max-w-sm">
              <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={cancelUpload}
              >
                Cancel
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium text-foreground">
                {value.originalName}
              </p>
              <p className="text-xs text-muted">
                .{value.extension.toUpperCase()} ·{" "}
                {formatBytes(Number(value.sizeBytes))}
                {value.scanSkipped
                  ? " · Scan skipped"
                  : value.scanResult
                    ? ` · Scan: ${value.scanResult}`
                    : null}
              </p>
              <p className="break-all font-mono text-[10px] text-muted">
                SHA-256 {value.checksumSha256}
              </p>
              {value.isApk && value.apk ? (
                <div className="mt-2 rounded-md bg-surface-muted px-3 py-2 text-xs text-muted">
                  <p className="font-medium text-foreground">Android APK</p>
                  {value.apk.packageName ? (
                    <p>Package: {value.apk.packageName}</p>
                  ) : null}
                  {value.apk.versionName ? (
                    <p>Version: {value.apk.versionName}</p>
                  ) : null}
                  {value.apk.versionCode != null ? (
                    <p>Version code: {value.apk.versionCode}</p>
                  ) : null}
                  {value.apk.minSdkVersion != null ? (
                    <p>Min SDK: {value.apk.minSdkVersion}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeFile}
                disabled={uploading}
              >
                Remove
              </Button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
