import { describe, expect, it } from "vitest";
import { DEFAULT_ROLE_PERMISSIONS, ROLE_SLUGS, PERMISSIONS } from "@/lib/permissions";

describe("RBAC defaults", () => {
  it("gives super admin every permission", () => {
    expect(DEFAULT_ROLE_PERMISSIONS[ROLE_SLUGS.SUPER_ADMIN]).toHaveLength(PERMISSIONS.length);
  });

  it("keeps analyst read-focused", () => {
    const keys = DEFAULT_ROLE_PERMISSIONS[ROLE_SLUGS.ANALYST];
    expect(keys).toContain("analytics.view");
    expect(keys).not.toContain("posts.delete");
  });

  it("allows content manager to publish", () => {
    const keys = DEFAULT_ROLE_PERMISSIONS[ROLE_SLUGS.CONTENT_MANAGER];
    expect(keys).toContain("posts.publish");
    expect(keys).toContain("software.publish");
  });
});
