import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { corsHeaders } from "@/lib/cors";

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https://www.youtube.com https://player.vimeo.com; frame-ancestors 'none';",
};

function applyHeaders(response: NextResponse, headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  // Flutter web (and other clients) call /api from another origin — allow CORS.
  if (pathname.startsWith("/api/")) {
    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: cors });
    }
    return applyHeaders(NextResponse.next(), cors);
  }

  const response = applyHeaders(NextResponse.next(), securityHeaders);

  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    if (!token?.sub) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Include /api for CORS. Skip static assets and large admin file uploads
     * so the proxy body buffer (default 10MB) does not truncate APK/ZIP uploads.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/admin/posts/files|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
