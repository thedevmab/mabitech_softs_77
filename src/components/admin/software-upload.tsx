"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SoftwareUploadForm({ softwareId }: { softwareId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("softwareId", softwareId);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message || "Upload failed");
      } else {
        setMessage(
          `Uploaded ${json.data.originalName} — status ${json.data.verificationStatus} (not auto-verified)`,
        );
        form.reset();
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <div className="space-y-2">
        <Label htmlFor="file">Upload software file</Label>
        <Input id="file" name="file" type="file" required />
        <p className="text-xs text-muted">
          Hosted files always enter PENDING_REVIEW and are never auto-verified.
        </p>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-primary">{message}</p> : null}
      <Button type="submit" disabled={busy} variant="secondary">
        {busy ? "Uploading…" : "Upload file"}
      </Button>
    </form>
  );
}
