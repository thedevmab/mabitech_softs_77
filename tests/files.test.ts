import { describe, expect, it } from "vitest";
import { getExtension } from "@/lib/storage/files";
import { sha256 } from "@/lib/utils";

describe("file helpers", () => {
  it("extracts lowercase extensions", () => {
    expect(getExtension("App.APK")).toBe("apk");
    expect(getExtension("archive.tar.zip")).toBe("zip");
  });

  it("computes stable sha256", () => {
    expect(sha256("hello")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});
