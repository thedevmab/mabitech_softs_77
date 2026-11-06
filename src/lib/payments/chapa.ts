import { createHmac, timingSafeEqual } from "crypto";
import { ApiError } from "@/lib/api";

export type ChapaVerifyResult = {
  success: boolean;
  reference: string;
  amountCents: number;
  currency: string;
  status: string;
  raw: unknown;
};

export function isChapaConfigured() {
  return Boolean(process.env.CHAPA_SECRET_KEY);
}

function requireChapaSecret() {
  const secret = process.env.CHAPA_SECRET_KEY;
  if (!secret) {
    throw new ApiError(
      503,
      "PAYMENT_NOT_CONFIGURED",
      "Chapa credentials are not configured",
    );
  }
  return secret;
}

export function verifyChapaWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || process.env.CHAPA_SECRET_KEY;
  if (!webhookSecret || !signature) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Server-side Chapa transaction verification.
 * Fails closed when credentials are missing — never trusts client claims alone.
 */
export async function verifyChapaPayment(txRef: string): Promise<ChapaVerifyResult> {
  const secret = requireChapaSecret();
  const base = process.env.CHAPA_BASE_URL || "https://api.chapa.co/v1";
  const res = await fetch(`${base}/transaction/verify/${encodeURIComponent(txRef)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok || !raw || raw.status !== "success") {
    throw new ApiError(400, "PAYMENT_VERIFY_FAILED", "Unable to verify Chapa payment");
  }

  const data = raw.data || {};
  const status = String(data.status || "").toLowerCase();
  const amount = Number(data.amount || 0);
  const currency = String(data.currency || "ETB");

  return {
    success: status === "success",
    reference: String(data.tx_ref || data.reference || txRef),
    amountCents: Math.round(amount * 100),
    currency,
    status,
    raw,
  };
}
