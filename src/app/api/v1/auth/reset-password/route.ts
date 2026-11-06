import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonError,
  jsonOk,
  parseJson,
} from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { revokeAllUserRefreshTokens } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";
import { hashToken } from "@/lib/utils";
import { logActivity } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`auth:reset:${ip}`, 10, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many reset attempts");
    }

    const body = await parseJson(request, schema);
    const tokenHash = hashToken(body.token);
    const emailToken = await prisma.emailToken.findUnique({ where: { tokenHash } });

    if (
      !emailToken ||
      emailToken.type !== "password_reset" ||
      emailToken.usedAt ||
      emailToken.expiresAt < new Date()
    ) {
      throw new ApiError(400, "INVALID_TOKEN", "Reset token is invalid or expired");
    }

    const passwordHash = await hashPassword(body.password);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: emailToken.userId },
        data: { passwordHash },
      }),
      prisma.emailToken.update({
        where: { id: emailToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await revokeAllUserRefreshTokens(emailToken.userId);
    await logActivity({
      userId: emailToken.userId,
      action: "auth.password_reset",
      entityType: "User",
      entityId: emailToken.userId,
      ip,
    });

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
