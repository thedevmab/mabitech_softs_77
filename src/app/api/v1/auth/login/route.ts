import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  parseJson,
} from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { issueRefreshToken, signAccessToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";
import { logActivity } from "@/lib/audit";
import { serializeUserPublic } from "@/lib/api/serializers";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`auth:login:${ip}`, 20, 900);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many login attempts");
    }

    const body = await parseJson(request, schema);
    const email = body.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash || user.deletedAt || user.status !== "ACTIVE") {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const valid = await verifyPassword(user.passwordHash, body.password);
    if (!valid) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const access = await signAccessToken({ id: user.id, email: user.email });
    const refresh = await issueRefreshToken(user.id);

    await logActivity({
      userId: user.id,
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
      ip,
    });

    return jsonOk({
      user: serializeUserPublic(user),
      accessToken: access.token,
      accessTokenExpiresIn: access.expiresIn,
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
