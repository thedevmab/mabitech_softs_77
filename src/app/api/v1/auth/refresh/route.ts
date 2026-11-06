import { z } from "zod";
import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  parseJson,
} from "@/lib/api";
import { rotateRefreshToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";
import { serializeUserPublic } from "@/lib/api/serializers";

const schema = z.object({
  refreshToken: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`auth:refresh:${ip}`, 60, 900);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many refresh attempts");
    }

    const body = await parseJson(request, schema);
    const rotated = await rotateRefreshToken(body.refreshToken);
    if (!rotated) {
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
    }

    return jsonOk({
      user: serializeUserPublic(rotated.user),
      accessToken: rotated.access.token,
      accessTokenExpiresIn: rotated.access.expiresIn,
      refreshToken: rotated.refresh.token,
      refreshTokenExpiresAt: rotated.refresh.expiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
