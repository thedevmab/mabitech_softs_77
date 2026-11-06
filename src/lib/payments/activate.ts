import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { logActivity } from "@/lib/audit";
import type { PaymentProvider } from "@prisma/client";

export async function activatePremiumFromPayment(params: {
  userId: string;
  provider: PaymentProvider;
  providerRef: string;
  amountCents: number;
  currency: string;
  planId?: string;
  rawPayload?: unknown;
}) {
  const existing = await prisma.payment.findUnique({
    where: {
      provider_providerRef: {
        provider: params.provider,
        providerRef: params.providerRef,
      },
    },
  });

  if (existing?.status === "COMPLETED") {
    return {
      payment: existing,
      subscription: null as null,
      alreadyProcessed: true as const,
    };
  }

  let plan =
    params.planId
      ? await prisma.subscriptionPlan.findFirst({
          where: { id: params.planId, isActive: true },
        })
      : null;

  if (!plan) {
    plan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true, isFree: false },
      orderBy: { priceCents: "asc" },
    });
  }

  if (!plan) {
    throw new ApiError(400, "NO_PLAN", "No active premium plan is available");
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + plan.intervalDays * 86400 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        userId: params.userId,
        planId: plan.id,
        status: "ACTIVE",
        startsAt,
        endsAt,
      },
    });

    const payment = existing
      ? await tx.payment.update({
          where: { id: existing.id },
          data: {
            status: "COMPLETED",
            amountCents: params.amountCents,
            currency: params.currency,
            subscriptionId: subscription.id,
            verifiedAt: new Date(),
            rawPayload: params.rawPayload as object | undefined,
          },
        })
      : await tx.payment.create({
          data: {
            userId: params.userId,
            subscriptionId: subscription.id,
            provider: params.provider,
            providerRef: params.providerRef,
            amountCents: params.amountCents,
            currency: params.currency,
            status: "COMPLETED",
            verifiedAt: new Date(),
            rawPayload: params.rawPayload as object | undefined,
          },
        });

    await tx.user.update({
      where: { id: params.userId },
      data: {
        isPremium: true,
        premiumExpiresAt: endsAt,
      },
    });

    return { payment, subscription };
  });

  await logActivity({
    userId: params.userId,
    action: "payment.activated",
    entityType: "Payment",
    entityId: result.payment.id,
    metadata: {
      provider: params.provider,
      providerRef: params.providerRef,
      planId: plan.id,
    },
  });

  return { ...result, alreadyProcessed: false as const };
}
