import { describe, expect, it } from "vitest";
import { isChapaConfigured } from "@/lib/payments/chapa";
import { isTelebirrConfigured } from "@/lib/payments/telebirr";
import { verifyTelebirrWebhookSignature } from "@/lib/payments/telebirr";

describe("payment providers fail closed", () => {
  it("reports Chapa unconfigured without secret", () => {
    const prev = process.env.CHAPA_SECRET_KEY;
    delete process.env.CHAPA_SECRET_KEY;
    expect(isChapaConfigured()).toBe(false);
    if (prev) process.env.CHAPA_SECRET_KEY = prev;
  });

  it("reports Telebirr unconfigured without credentials", () => {
    const prev = {
      id: process.env.TELEBIRR_APP_ID,
      key: process.env.TELEBIRR_APP_KEY,
      base: process.env.TELEBIRR_BASE_URL,
    };
    delete process.env.TELEBIRR_APP_ID;
    delete process.env.TELEBIRR_APP_KEY;
    delete process.env.TELEBIRR_BASE_URL;
    expect(isTelebirrConfigured()).toBe(false);
    if (prev.id) process.env.TELEBIRR_APP_ID = prev.id;
    if (prev.key) process.env.TELEBIRR_APP_KEY = prev.key;
    if (prev.base) process.env.TELEBIRR_BASE_URL = prev.base;
  });

  it("rejects telebirr webhooks without valid signature", () => {
    process.env.TELEBIRR_APP_KEY = "test-key";
    expect(verifyTelebirrWebhookSignature({ a: "1" }, null)).toBe(false);
    expect(verifyTelebirrWebhookSignature({ a: "1" }, "bad")).toBe(false);
  });
});
