import { requireAdminPermission } from "@/lib/admin/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function fetchHealth() {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://127.0.0.1:3000";
  const started = Date.now();
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/health`, {
      cache: "no-store",
    });
    const json = (await res.json()) as { data?: Record<string, unknown> };
    return {
      ok: res.ok,
      latencyMs: Date.now() - started,
      data: json.data ?? null,
      error: null as string | null,
    };
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      data: null,
      error: e instanceof Error ? e.message : "Health check failed",
    };
  }
}

export default async function AdminHealthPage() {
  await requireAdminPermission("settings.manage");
  const result = await fetchHealth();
  const services =
    result.data && typeof result.data === "object" && "services" in result.data
      ? (result.data.services as Record<string, Record<string, unknown>>)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">API & Integration Health</h2>
        <p className="text-sm text-muted">
          Safe operational status only — no secrets, connection strings, or stack traces.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{result.ok ? "Reachable" : "Unreachable"}</p>
            <p className="text-sm text-muted">{result.latencyMs} ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {String((result.data as { status?: string } | null)?.status || "unknown")}
            </p>
            <p className="text-sm text-muted">
              Checked{" "}
              {String((result.data as { checkedAt?: string } | null)?.checkedAt || "—")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs">GET /api/v1/health</code>
            {result.error ? (
              <p className="mt-2 text-sm text-destructive">{result.error}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {services ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {Object.entries(services).map(([name, info]) => (
                <li key={name} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
                  <span className="font-medium capitalize">{name}</span>
                  <span className="text-sm text-muted">
                    configured={String(info.configured ?? "—")} · verified=
                    {String(info.verified ?? false)}
                    {info.status ? ` · status=${String(info.status)}` : ""}
                    {info.driver ? ` · driver=${String(info.driver)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              “Configured” means required environment values are present. “Verified” means a live
              probe succeeded in this check (database only today).
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
