import { describe, expect, it } from "vitest";

type InstallState = "not_installed" | "update_available" | "up_to_date";

function resolveInstallState(
  clientVersionCode: number | null | undefined,
  latestVersionCode: number | null | undefined,
): InstallState {
  if (clientVersionCode == null || clientVersionCode <= 0) return "not_installed";
  if (latestVersionCode != null && clientVersionCode < latestVersionCode) {
    return "update_available";
  }
  return "up_to_date";
}

describe("install state from client report", () => {
  it("never treats a download initiation as installed", () => {
    expect(resolveInstallState(undefined, 10)).toBe("not_installed");
    expect(resolveInstallState(null, 10)).toBe("not_installed");
  });

  it("detects updates from reported version codes", () => {
    expect(resolveInstallState(5, 10)).toBe("update_available");
    expect(resolveInstallState(10, 10)).toBe("up_to_date");
  });
});
