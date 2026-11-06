import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { verifyChapaWebhookSignature, verifyChapaPayment } from "@/lib/payments/chapa";
import { activatePremiumFromPayment } from "@/lib/payments/activate";
import { logActivity } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("x-chapa-signature") ||
      request.headers.get("chapa-signature");

    if (!verifyChapaWebhookSignature(rawBody, signature)) {
      return jsonError(401, "INVALID_SIGNATURE", "Webhook signature verification failed");
    }

    const payload = JSON.parse(rawBody) as {
      tx_ref?: string;
      reference?: string;
      status?: string;
      meta?: { userId?: string; planId?: string };
    };

    const providerRef = payload.tx_ref || payload.reference;
    if (!providerRef) {
      return jsonError(400, "MISSING_REF", "Missing transaction reference");
    }

    // Always re-verify with Chapa — never activate from webhook body alone
    const verified = await verifyChapaPayment(providerRef);
    if (!verified.success) {
      return jsonOk({ received: true, activated: false });
    }

    let payment = await prisma.payment.findUnique({
      where: {
        provider_providerRef: { provider: "CHAPA", providerRef },
      },
    });

    const userId = payment?.userId || payload.meta?.userId;
    if (!userId) {
      return jsonError(400, "UNKNOWN_USER", "Cannot map payment to a user");
    }

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          userId,
          provider: "CHAPA",
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
      provider: "CHAPA",
      providerRef,
      amountCents: verified.amountCents,
      currency: verified.currency,
      planId: payload.meta?.planId,
      rawPayload: verified.raw,
    });

    await logActivity({
      userId,
      action: "webhook.chapa",
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
