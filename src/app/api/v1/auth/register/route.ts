import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonCreated,
  jsonError,
  parseJson,
} from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { issueRefreshToken, signAccessToken } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";
import { logActivity } from "@/lib/audit";
import { sendMail } from "@/lib/mail";
import { absoluteUrl, hashToken, randomToken } from "@/lib/utils";
import { serializeUserPublic } from "@/lib/api/serializers";

const schema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`auth:register:${ip}`, 10, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many registration attempts");
    }

    const body = await parseJson(request, schema);
    const email = body.email.toLowerCase();

    const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
    if (settings && !settings.registrationEnabled) {
      throw new ApiError(403, "REGISTRATION_DISABLED", "Registration is currently disabled");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
      throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }

    const passwordHash = await hashPassword(body.password);
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: body.name || existing.name,
            passwordHash,
            status: "ACTIVE",
            deletedAt: null,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            name: body.name,
            passwordHash,
            status: "ACTIVE",
          },
        });

    if (settings?.requireEmailVerify) {
      const raw = randomToken(32);
      await prisma.emailToken.create({
        data: {
          userId: user.id,
          type: "email_verify",
          tokenHash: hashToken(raw),
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        },
      });
      await sendMail({
        to: user.email,
        subject: "Verify your email",
        html: `<p>Verify your email: <a href="${absoluteUrl(`/verify-email?token=${raw}`)}">${absoluteUrl(`/verify-email?token=${raw}`)}</a></p>`,
        text: `Verify your email: ${absoluteUrl(`/verify-email?token=${raw}`)}`,
      });
    }

    const access = await signAccessToken({ id: user.id, email: user.email });
    const refresh = await issueRefreshToken(user.id);

    await logActivity({
      userId: user.id,
      action: "auth.register",
      entityType: "User",
      entityId: user.id,
      ip,
    });

    return jsonCreated({
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
