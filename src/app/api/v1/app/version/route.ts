import { prisma } from "@/lib/db";
import { handleApiError, jsonOk, publicCacheHeaders } from "@/lib/api";

export async function GET() {
  try {
    const app = await prisma.appSettings.findUnique({ where: { id: "default" } });
    return jsonOk(
      {
        minAppVersion: app?.minAppVersion ?? "1.0.0",
        recommendedAppVersion:
          app?.recommendedAppVersion ?? app?.minAppVersion ?? "1.0.0",
        forceUpdate: app?.forceUpdate ?? false,
        updateUrl: app?.updateUrl ?? null,
      },
      { headers: publicCacheHeaders(60) },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
