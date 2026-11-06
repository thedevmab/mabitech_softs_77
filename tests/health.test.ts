import { describe, expect, it } from "vitest";
import { publicCacheHeaders, privateNoStoreHeaders } from "@/lib/api";
import { isFcmConfigured } from "@/lib/notifications/fcm";
import { PERMISSIONS } from "@/lib/permissions";

describe("api cache helpers", () => {
  it("public cache is short-lived", () => {
    const h = publicCacheHeaders(60) as Record<string, string>;
    expect(h["Cache-Control"]).toContain("s-maxage=60");
  });

  it("private headers forbid store", () => {
    const h = privateNoStoreHeaders() as Record<string, string>;
    expect(h["Cache-Control"]).toBe("private, no-store");
  });
});

describe("permissions for moderation and settings", () => {
  it("includes reports.manage and settings.manage", () => {
    const keys = PERMISSIONS.map((p) => p.key);
    expect(keys).toContain("reports.manage");
    expect(keys).toContain("settings.manage");
  });
});

describe("fcm config probe", () => {
  it("does not throw and returns boolean", () => {
    expect(typeof isFcmConfigured()).toBe("boolean");
  });
});
