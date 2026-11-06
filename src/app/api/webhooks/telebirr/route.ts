import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import {
  verifyTelebirrWebhookSignature,
  verifyTelebirrPayment,
} from "@/lib/payments/telebirr";
import { activatePremiumFromPayment } from "@/lib/payments/activate";
import { logActivity } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("x-telebirr-signature") ||
      request.headers.get("signature");

    if (!verifyTelebirrWebhookSignature(rawBody, signature)) {
      return jsonError(401, "INVALID_SIGNATURE", "Webhook signature verification failed");
    }

    const payload = JSON.parse(rawBody) as {
      outTradeNo?: string;
      merchOrderId?: string;
      tradeStatus?: string;
      meta?: { userId?: string; planId?: string };
      userId?: string;
      planId?: string;
    };

    const providerRef = payload.outTradeNo || payload.merchOrderId;
    if (!providerRef) {
      return jsonError(400, "MISSING_REF", "Missing trade reference");
    }

    // Always re-verify with Telebirr — never activate from webhook body alone
    const verified = await verifyTelebirrPayment(providerRef);
    if (!verified.success) {
      return jsonOk({ received: true, activated: false });
    }

    let payment = await prisma.payment.findUnique({
      where: {
        provider_providerRef: { provider: "TELEBIRR", providerRef },
      },
    });

    const userId = payment?.userId || payload.meta?.userId || payload.userId;
    if (!userId) {
      return jsonError(400, "UNKNOWN_USER", "Cannot map payment to a user");
    }

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          userId,
          provider: "TELEBIRR",
          providerRef,
          amountCents: verified.amountCents,
          currency: verified.currency,
          status: "PENDING",
          rawPayload: verified.raw as object,
        },
      });
    }

    const result = await activatePremiumFromPayment({
      userId,
      provider: "TELEBIRR",
      providerRef,
      amountCents: verified.amountCents,
      currency: verified.currency,
      planId: payload.meta?.planId || payload.planId,
      rawPayload: verified.raw,
    });

    await logActivity({
      userId,
      action: "webhook.telebirr",
      entityType: "Payment",
      entityId: result.payment.id,
      metadata: { providerRef, activated: !result.alreadyProcessed },
    });

    return jsonOk({
      received: true,
      activated: !result.alreadyProcessed,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
