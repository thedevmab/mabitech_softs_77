const DEV_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

function configuredOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      fromEnv.push(new URL(appUrl).origin);
    } catch {
      // ignore invalid APP_URL
    }
  }
  return [...new Set(fromEnv)];
}

export function resolveCorsOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (configuredOrigins().includes(origin)) return origin;
  if (process.env.NODE_ENV !== "production" && DEV_ORIGIN.test(origin)) {
    return origin;
  }
  return null;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = resolveCorsOrigin(origin);
  if (!allowed) return {};

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, Accept, X-Requested-With",
    "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
