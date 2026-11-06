"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";

const emailSchema = z.string().trim().email().max(255);

export async function subscribeNewsletter(email: string) {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false as const, message: "Enter a valid email address." };
  }

  const normalized = parsed.data.toLowerCase();

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalized },
    });

    if (existing?.isActive) {
      return { ok: true as const, message: "You're already subscribed." };
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      update: { isActive: true, confirmedAt: new Date() },
      create: {
        email: normalized,
        isActive: true,
        confirmedAt: new Date(),
      },
    });

    return { ok: true as const, message: "Thanks for subscribing." };
  } catch {
    return { ok: false as const, message: "Could not subscribe right now. Try again later." };
  }
}
