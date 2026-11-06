"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function HostedDownloadButton({
  slug,
  fileId,
  label = "Download file",
}: {
  slug: string;
  fileId: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/software/${encodeURIComponent(slug)}/download?fileId=${encodeURIComponent(fileId)}`,
        { credentials: "same-origin" },
      );

      if (res.status === 401) {
        toast.error("Sign in to download hosted files.");
        router.push(`/login?callbackUrl=${encodeURIComponent(`/software/${slug}`)}`);
        return;
      }

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.error?.message || payload?.message || "Download unavailable.");
        return;
      }

      const url = payload?.data?.url || payload?.url;
      if (!url || typeof url !== "string") {
        toast.error("Download link was not returned.");
        return;
      }

      toast.message("Opening download. This does not install the software.");
      window.location.assign(url);
    } catch {
      toast.error("Could not start download.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" className="mt-3 w-full" size="sm" onClick={onClick} disabled={loading}>
      <Download className="h-4 w-4" />
      {loading ? "Preparing…" : label}
    </Button>
  );
}
