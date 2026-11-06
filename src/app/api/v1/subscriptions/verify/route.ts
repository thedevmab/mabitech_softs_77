import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonOk,
  parseJson,
} from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";
import { verifyChapaPayment } from "@/lib/payments/chapa";
import { verifyTelebirrPayment } from "@/lib/payments/telebirr";
import { activatePremiumFromPayment } from "@/lib/payments/activate";

const schema = z.object({
  provider: z.enum(["CHAPA", "TELEBIRR"]),
  providerRef: z.string().min(1).max(255),
  planId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = await parseJson(request, schema);

    if (body.planId) {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { id: body.planId, isActive: true, isFree: false },
      });
      if (!plan) throw new ApiError(400, "INVALID_PLAN", "Subscription plan not found");
    }

    // Pending payment record so we never activate from client claim alone
    await prisma.payment.upsert({
      where: {
        provider_providerRef: {
          provider: body.provider,
          providerRef: body.providerRef,
        },
      },
      update: {},
      create: {
        userId: user.id,
        provider: body.provider,
        providerRef: body.providerRef,
        amountCents: 0,
        currency: "ETB",
        status: "PENDING",
      },
    });

    const verified =
      body.provider === "CHAPA"
        ? await verifyChapaPayment(body.providerRef)
        : await verifyTelebirrPayment(body.providerRef);

    if (!verified.success) {
      await prisma.payment.update({
        where: {
          provider_providerRef: {
            provider: body.provider,
            providerRef: body.providerRef,
          },
        },
        data: {
          status: "FAILED",
          rawPayload: verified.raw as object,
        },
      });
      throw new ApiError(400, "PAYMENT_NOT_SUCCESSFUL", "Payment was not successful");
    }

    const result = await activatePremiumFromPayment({
      userId: user.id,
      provider: body.provider,
      providerRef: verified.reference || body.providerRef,
      amountCents: verified.amountCents,
      currency: verified.currency,
      planId: body.planId,
      rawPayload: verified.raw,
    });

    return jsonOk({
      activated: !result.alreadyProcessed,
      alreadyProcessed: result.alreadyProcessed,
      paymentId: result.payment.id,
      subscriptionId: result.subscription?.id ?? null,
      premiumExpiresAt: (
        await prisma.user.findUnique({ where: { id: user.id } })
      )?.premiumExpiresAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
