import { z } from "zod";
import { handleApiError, jsonOk, parseJson } from "@/lib/api";
import { revokeRefreshToken } from "@/lib/auth/jwt";
import { getBearerUser } from "@/lib/auth/request-user";
import { logActivity } from "@/lib/audit";
import { getClientIp } from "@/lib/api/request";

const schema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    let refreshToken: string | undefined;
    try {
      const body = await parseJson(request, schema);
      refreshToken = body.refreshToken;
    } catch {
      refreshToken = undefined;
    }
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    const user = await getBearerUser(request);
    if (user) {
      await logActivity({
        userId: user.id,
        action: "auth.logout",
        entityType: "User",
        entityId: user.id,
        ip: getClientIp(request),
      });
    }
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
