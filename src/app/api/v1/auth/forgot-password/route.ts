import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk, parseJson } from "@/lib/api";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";
import { sendMail } from "@/lib/mail";
import { absoluteUrl, hashToken, randomToken } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`auth:forgot:${ip}`, 5, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many password reset requests");
    }

    const body = await parseJson(request, schema);
    const email = body.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid account enumeration
    if (user && !user.deletedAt && user.status === "ACTIVE") {
      const raw = randomToken(32);
      await prisma.emailToken.create({
        data: {
          userId: user.id,
          type: "password_reset",
          tokenHash: hashToken(raw),
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });
      await sendMail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Reset your password: <a href="${absoluteUrl(`/reset-password?token=${raw}`)}">${absoluteUrl(`/reset-password?token=${raw}`)}</a></p>`,
        text: `Reset your password: ${absoluteUrl(`/reset-password?token=${raw}`)}`,
      });
    }

    return jsonOk({
      success: true,
      message: "If an account exists for that email, a reset link has been sent",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
