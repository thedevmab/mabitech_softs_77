import { createHmac, createVerify, timingSafeEqual } from "crypto";
import { ApiError } from "@/lib/api";

export type TelebirrVerifyResult = {
  success: boolean;
  reference: string;
  amountCents: number;
  currency: string;
  status: string;
  raw: unknown;
};

export function isTelebirrConfigured() {
  return Boolean(
    process.env.TELEBIRR_APP_ID &&
      process.env.TELEBIRR_APP_KEY &&
      process.env.TELEBIRR_BASE_URL,
  );
}

function requireTelebirrConfig() {
  const appId = process.env.TELEBIRR_APP_ID;
  const appKey = process.env.TELEBIRR_APP_KEY;
  const baseUrl = process.env.TELEBIRR_BASE_URL;
  if (!appId || !appKey || !baseUrl) {
    throw new ApiError(
      503,
      "PAYMENT_NOT_CONFIGURED",
      "Telebirr credentials are not configured",
    );
  }
  return {
    appId,
    appKey,
    publicKey: process.env.TELEBIRR_PUBLIC_KEY,
    baseUrl,
  };
}

export function verifyTelebirrWebhookSignature(
  rawBody: string | object,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const body = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);
  const publicKey = process.env.TELEBIRR_PUBLIC_KEY;
  if (publicKey) {
    try {
      const verifier = createVerify("RSA-SHA256");
      verifier.update(body);
      verifier.end();
      const pem = publicKey.includes("BEGIN")
        ? publicKey
        : `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
      if (verifier.verify(pem, signature, "base64")) return true;
    } catch {
      // fall through to HMAC
    }
  }
  const appKey = process.env.TELEBIRR_APP_KEY;
  if (!appKey) return false;
  const expected = createHmac("sha256", appKey).update(body).digest("hex");
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
 * Server-side Telebirr order/query verification.
 * Fails closed when credentials are missing — never trusts client claims alone.
 */
export async function verifyTelebirrPayment(
  outTradeNo: string,
): Promise<TelebirrVerifyResult> {
  const { appId, appKey, baseUrl } = requireTelebirrConfig();
  const timestamp = Date.now().toString();
  const nonce = timestamp.slice(-8);
  const payload = {
    appId,
    outTradeNo,
    timestamp,
    nonce,
  };
  const sign = createHmac("sha256", appKey)
    .update(JSON.stringify(payload))
    .digest("hex");

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/payment/v1/merchant/queryOrder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: sign,
    },
    body: JSON.stringify({ ...payload, sign }),
    cache: "no-store",
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok || !raw) {
    throw new ApiError(400, "PAYMENT_VERIFY_FAILED", "Unable to verify Telebirr payment");
  }

  const data = raw.data || raw;
  const status = String(data.tradeStatus || data.status || "").toUpperCase();
  const amount = Number(data.totalAmount || data.amount || 0);
  const success = ["Completed", "SUCCESS", "PAID", "2"].includes(status) || status === "COMPLETED";

  return {
    success,
    reference: String(data.outTradeNo || data.merchOrderId || outTradeNo),
    amountCents: Math.round(amount * (amount < 1000 ? 100 : 1)),
    currency: String(data.currency || "ETB"),
    status,
    raw,
  };
}
