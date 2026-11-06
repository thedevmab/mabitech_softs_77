import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonOk,
  parseJson,
  privateNoStoreHeaders,
} from "@/lib/api";
import { hashToken } from "@/lib/utils";
import { rateLimit } from "@/lib/redis";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(12),
  purpose: z.enum(["email_verification", "password_reset"]).default("email_verification"),
});

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, schema);
    const email = body.email.toLowerCase();

    const limited = await rateLimit(`otp-verify:${email}`, 10, 60 * 15);
    if (!limited.allowed) {
      throw new ApiError(429, "RATE_LIMITED", "Too many verification attempts. Try again later.");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal account existence
      throw new ApiError(400, "INVALID_OTP", "Invalid or expired code");
    }

    const tokenHash = hashToken(body.otp.trim());
    const record = await prisma.emailToken.findUnique({ where: { tokenHash } });
    if (
      !record ||
      record.userId !== user.id ||
      record.type !== body.purpose ||
      record.usedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new ApiError(400, "INVALID_OTP", "Invalid or expired code");
    }

    await prisma.$transaction(async (tx) => {
      await tx.emailToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      if (body.purpose === "email_verification") {
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    });

    return jsonOk(
      {
        verified: true,
        purpose: body.purpose,
        emailVerified: body.purpose === "email_verification",
      },
      { headers: privateNoStoreHeaders() },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
