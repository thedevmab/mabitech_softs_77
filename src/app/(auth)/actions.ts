"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { absoluteUrl, hashToken, randomToken } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(8).max(128);

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { ok: false as const, message: "Invalid email or password." };
    }

    return { ok: true as const, message: "Signed in." };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false as const, message: "Invalid email or password." };
    }
    throw error;
  }
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false as const, message: "Check your name, email, and password (min 8 characters)." };
  }

  const email = parsed.data.email.toLowerCase();
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (settings && !settings.registrationEnabled) {
    return { ok: false as const, message: "Registration is currently disabled." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.deletedAt) {
    return { ok: false as const, message: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name,
          passwordHash,
          status: "ACTIVE",
          deletedAt: null,
          emailVerified: null,
        },
      })
    : await prisma.user.create({
        data: {
          name: parsed.data.name,
          email,
          passwordHash,
        },
      });

  const token = randomToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.emailToken.create({
    data: {
      userId: user.id,
      type: "email_verification",
      tokenHash,
      expiresAt,
    },
  });

  const verifyUrl = absoluteUrl(`/verify-email?token=${token}`);
  await sendMail({
    to: email,
    subject: "Verify your email",
    text: `Verify your email: ${verifyUrl}`,
    html: `<p>Welcome to the platform.</p><p><a href="${verifyUrl}">Verify your email</a></p><p>This link expires in 24 hours.</p>`,
  });

  return {
    ok: true as const,
    message: "Account created. Check your email to verify your address.",
  };
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false as const, message: "Enter a valid email address." };
  }

  const email = parsed.data.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid account enumeration
  if (user && !user.deletedAt && user.status === "ACTIVE") {
    const token = randomToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.emailToken.create({
      data: {
        userId: user.id,
        type: "password_reset",
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = absoluteUrl(`/reset-password?token=${token}`);
    await sendMail({
      to: email,
      subject: "Reset your password",
      text: `Reset your password: ${resetUrl}`,
      html: `<p>Reset your password using the link below.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
    });
  }

  return {
    ok: true as const,
    message: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!token || !parsed.success) {
    return { ok: false as const, message: "Invalid token or password (min 8 characters)." };
  }

  const tokenHash = hashToken(token);
  const record = await prisma.emailToken.findUnique({ where: { tokenHash } });
  if (
    !record ||
    record.type !== "password_reset" ||
    record.usedAt ||
    record.expiresAt.getTime() < Date.now()
  ) {
    return { ok: false as const, message: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(parsed.data);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.emailToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true as const, message: "Password updated. You can sign in now." };
}

export async function verifyEmailAction(token: string) {
  if (!token) {
    return { ok: false as const, message: "Missing verification token." };
  }

  const tokenHash = hashToken(token);
  const record = await prisma.emailToken.findUnique({ where: { tokenHash } });
  if (
    !record ||
    record.type !== "email_verification" ||
    record.usedAt ||
    record.expiresAt.getTime() < Date.now()
  ) {
    return { ok: false as const, message: "This verification link is invalid or has expired." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true as const, message: "Email verified. You can sign in." };
}
