import { promises as fs } from "fs";
import path from "path";
import { requireAdminUser } from "@/lib/admin/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function findOpenApi() {
  const candidates = [
    "openapi/v1.json",
    "public/openapi/v1.json",
    "openapi.yaml",
    "openapi.yml",
    "openapi.json",
    "public/openapi.yaml",
    "public/openapi.yml",
    "public/openapi.json",
    "docs/openapi.yaml",
    "docs/openapi.json",
  ];
  for (const rel of candidates) {
    const full = path.join(process.cwd(), rel);
    try {
      await fs.access(full);
      return { rel, full, publicUrl: rel.startsWith("public/") ? `/${rel.slice(7)}` : null };
    } catch {
      /* continue */
    }
  }
  return null;
}

export default async function AdminApiDocsPage() {
  await requireAdminUser();
  const found = await findOpenApi();
  let preview = "";
  if (found) {
    const raw = await fs.readFile(found.full, "utf8");
    preview = raw.slice(0, 4000);
  }

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
                OpenAPI spec found at <code className="text-primary">{found.rel}</code>
              </p>
              <div className="flex flex-wrap gap-2">
                {found.publicUrl ? (
                  <Button asChild>
                    <a href={found.publicUrl} target="_blank" rel="noreferrer">
                      Open public URL
                    </a>
                  </Button>
                ) : null}
                <Button asChild variant="secondary">
                  <a
                    href={`https://editor.swagger.io/?url=${encodeURIComponent(
                      found.publicUrl
                        ? `${process.env.APP_URL || "http://localhost:3000"}${found.publicUrl}`
                        : "",
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
              <p>No OpenAPI file was found in the project root, public/, or docs/.</p>
              <p>
                Add <code className="text-primary">openapi.yaml</code> or{" "}
                <code className="text-primary">public/openapi.json</code> to enable embedding
                here.
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
