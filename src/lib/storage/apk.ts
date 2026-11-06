export type ApkMetadata = {
  packageName: string | null;
  versionName: string | null;
  versionCode: number | null;
  minSdkVersion: number | null;
};

/**
 * Best-effort APK manifest extraction. Failures return null fields —
 * the upload is still accepted.
 */
export async function readApkMetadata(buffer: Buffer): Promise<ApkMetadata> {
  const empty: ApkMetadata = {
    packageName: null,
    versionName: null,
    versionCode: null,
    minSdkVersion: null,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ApkReader = require("@devicefarmer/adbkit-apkreader") as {
      open: (apk: Buffer) => Promise<{
        readManifest: () => Promise<{
          package?: string;
          versionName?: string;
          versionCode?: number | string;
          usesSdk?: { minSdkVersion?: number | string };
        }>;
      }>;
    };
    const reader = await ApkReader.open(buffer);
    const manifest = await reader.readManifest();
    const versionCodeRaw = manifest.versionCode;
    const minSdkRaw = manifest.usesSdk?.minSdkVersion;
    return {
      packageName: manifest.package || null,
      versionName: manifest.versionName || null,
      versionCode:
        versionCodeRaw === undefined || versionCodeRaw === null
          ? null
          : Number(versionCodeRaw) || null,
      minSdkVersion:
        minSdkRaw === undefined || minSdkRaw === null ? null : Number(minSdkRaw) || null,
    };
  } catch {
    return empty;
  }
}
