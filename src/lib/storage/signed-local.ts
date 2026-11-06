import { createHmac, timingSafeEqual } from "crypto";

function signingSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.AUTH_SECRET || "dev-local-sign";
}

export function signLocalDownloadParams(params: {
  key: string;
  exp: number;
  filename?: string;
}) {
  const payload = `${params.key}|${params.exp}|${params.filename || ""}`;
  return createHmac("sha256", signingSecret()).update(payload).digest("hex");
}

export function verifyLocalDownloadSignature(params: {
  key: string;
  exp: number;
  filename?: string;
  sig: string;
}) {
  if (!params.sig || Date.now() > params.exp) return false;
  const expected = signLocalDownloadParams({
    key: params.key,
    exp: params.exp,
    filename: params.filename,
  });
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(params.sig);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
