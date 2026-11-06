import { describe, expect, it } from "vitest";
import { PostDeliveryType, PostStatus } from "@prisma/client";
import { validateUpload, getExtension } from "@/lib/storage/files";
import { validateExternalUrl, parseDeliveryType } from "@/lib/posts/delivery";
import { serializePost } from "@/lib/api/serializers";
import { ApiError } from "@/lib/api";

function pdfBuffer() {
  return Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");
}

function zipBuffer() {
  // ZIP local file header + enough padding for magic checks
  const header = Buffer.from([
    0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  return Buffer.concat([header, Buffer.alloc(64)]);
}

function exeBuffer() {
  return Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
}

describe("post delivery helpers", () => {
  it("parses delivery types", () => {
    expect(parseDeliveryType("file")).toBe(PostDeliveryType.FILE);
    expect(parseDeliveryType("LINK")).toBe(PostDeliveryType.LINK);
    expect(parseDeliveryType("nope")).toBe(PostDeliveryType.NONE);
  });

  it("validates external https URLs", () => {
    expect(validateExternalUrl("https://example.com/app")).toContain("https://");
  });

  it("rejects javascript and credential URLs", () => {
    expect(() => validateExternalUrl("javascript:alert(1)")).toThrow(ApiError);
    expect(() => validateExternalUrl("https://user:pass@evil.com")).toThrow(ApiError);
    expect(() => validateExternalUrl("data:text/html,hi")).toThrow(ApiError);
    expect(() => validateExternalUrl("not-a-url")).toThrow(ApiError);
  });
});

describe("upload validation for post files", () => {
  it("accepts PDF and ZIP signatures", async () => {
    const pdf = await validateUpload({
      buffer: pdfBuffer(),
      filename: "guide.pdf",
      allowedExtensions: ["pdf", "zip", "apk", "docx"],
    });
    expect(pdf.ext).toBe("pdf");
    expect(pdf.checksumSha256).toHaveLength(64);

    const zip = await validateUpload({
      buffer: zipBuffer(),
      filename: "bundle.zip",
      allowedExtensions: ["pdf", "zip", "apk", "docx"],
    });
    expect(zip.ext).toBe("zip");
  });

  it("accepts docx as zip-based OOXML", async () => {
    const docx = await validateUpload({
      buffer: zipBuffer(),
      filename: "notes.docx",
      allowedExtensions: ["docx", "pdf"],
    });
    expect(docx.ext).toBe("docx");
  });

  it("rejects renamed executables against the post allowlist", async () => {
    await expect(
      validateUpload({
        buffer: exeBuffer(),
        filename: "malware.apk",
        allowedExtensions: ["apk", "pdf", "zip"],
      }),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      validateUpload({
        buffer: exeBuffer(),
        filename: "tool.exe",
        allowedExtensions: ["apk", "pdf", "zip"],
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("extracts extensions", () => {
    expect(getExtension("App.APK")).toBe("apk");
    expect(getExtension("report.DOCX")).toBe("docx");
  });
});

describe("serializePost delivery fields", () => {
  const base = {
    id: "p1",
    title: "Hello",
    slug: "hello",
    excerpt: "excerpt",
    content: "<p>body</p>",
    featuredImage: null,
    gallery: [] as string[],
    videoEmbed: null,
    status: PostStatus.PUBLISHED,
    isFeatured: false,
    isSponsored: false,
    deliveryType: PostDeliveryType.NONE,
    externalUrl: null,
    linkDescription: null,
    version: null,
    publisher: null,
    releaseDate: null,
    fileId: null,
    seoTitle: null,
    seoDescription: null,
    keywords: [] as string[],
    socialTitle: null,
    socialDescription: null,
    socialImage: null,
    viewCount: 0,
    scheduledAt: null,
    publishedAt: new Date("2026-01-01"),
    authorId: "u1",
    deletedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  it("serializes none delivery without file or url", () => {
    const out = serializePost(base, { includeContent: false });
    expect(out.deliveryType).toBe("none");
    expect(out.file).toBeNull();
    expect(out.externalUrl).toBeNull();
    expect(out.content).toBeUndefined();
  });

  it("serializes link delivery", () => {
    const out = serializePost({
      ...base,
      deliveryType: PostDeliveryType.LINK,
      externalUrl: "https://example.com/get",
      linkDescription: "Official site",
    });
    expect(out.deliveryType).toBe("link");
    expect(out.externalUrl).toBe("https://example.com/get");
    expect(out.linkDescription).toBe("Official site");
    expect(out.file).toBeNull();
  });

  it("serializes file delivery with apk metadata and without storage keys", () => {
    const out = serializePost({
      ...base,
      deliveryType: PostDeliveryType.FILE,
      version: "1.2.0",
      publisher: "Daily Tips",
      file: {
        id: "f1",
        originalName: "app.apk",
        extension: "apk",
        mimeType: "application/vnd.android.package-archive",
        sizeBytes: BigInt(2048),
        checksumSha256: "abc",
        apkPackage: "com.example.app",
        apkVersionName: "1.2.0",
        apkVersionCode: 12,
        apkMinSdk: 24,
        downloadCount: 3,
      },
    });
    expect(out.deliveryType).toBe("file");
    expect(out.file?.isApk).toBe(true);
    expect(out.file?.name).toBe("app.apk");
    expect(out.file?.sizeBytes).toBe(2048);
    expect(out.file?.apk?.packageName).toBe("com.example.app");
    expect(JSON.stringify(out)).not.toContain("storageKey");
    expect(out.version).toBe("1.2.0");
  });
});
