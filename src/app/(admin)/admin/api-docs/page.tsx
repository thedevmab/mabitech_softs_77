import { promises as fs } from "fs";
import path from "path";
import { requireAdminUser } from "@/lib/admin/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminApiDocsPage() {
  await requireAdminUser();

  const rel = "public/openapi/v1.json";
  const full = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "openapi", "v1.json");
  let preview = "";
  let found = false;

  try {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ full, "utf8");
    preview = raw.slice(0, 4000);
    found = true;
  } catch {
    found = false;
  }

  const publicUrl = "/openapi/v1.json";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {found ? (
            <>
              <p className="text-sm text-muted">
                OpenAPI spec found at <code className="text-primary">{rel}</code>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={publicUrl} target="_blank" rel="noreferrer">
                    Open public URL
                  </a>
                </Button>
                <Button asChild variant="secondary">
                  <a
                    href={`https://editor.swagger.io/?url=${encodeURIComponent(
                      `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${publicUrl}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Swagger Editor
                  </a>
                </Button>
              </div>
              <pre className="max-h-[480px] overflow-auto rounded-lg border border-border bg-surface p-4 text-xs text-muted">
                {preview}
                {preview.length >= 4000 ? "\n… truncated …" : ""}
              </pre>
            </>
          ) : (
            <div className="space-y-3 text-sm text-muted">
              <p>
                No OpenAPI file was found at{" "}
                <code className="text-primary">public/openapi/v1.json</code>.
              </p>
              <Button asChild variant="secondary">
                <a href="https://swagger.io/specification/" target="_blank" rel="noreferrer">
                  OpenAPI specification
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
