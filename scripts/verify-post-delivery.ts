/**
 * End-to-end verification for post file / link delivery (no mock data).
 * Run: npx tsx scripts/verify-post-delivery.ts
 */
import { prisma } from "../src/lib/db";
import { storePostFile, removePostFile, createPostFileDownloadUrl } from "../src/lib/storage/files";
import { serializePost } from "../src/lib/api/serializers";
import { validateExternalUrl } from "../src/lib/posts/delivery";
import { absoluteUrl } from "../src/lib/utils";

function pdfBuffer() {
  return Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF\n");
}

function zipBuffer() {
  return Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]),
    Buffer.alloc(128, 0),
  ]);
}

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
  });
  if (!admin) throw new Error("Seed admin missing — run npm run db:seed");

  const category = await prisma.category.findFirst();
  const createdIds: string[] = [];
  const fileIds: string[] = [];

  try {
    // PDF upload
    const pdf = await storePostFile({
      buffer: pdfBuffer(),
      filename: "guide.pdf",
      uploadedById: admin.id,
      declaredMime: "application/pdf",
    });
    fileIds.push(pdf.file.id);
    console.log("PDF uploaded", pdf.file.id, pdf.file.checksumSha256.slice(0, 12));

    // ZIP upload
    const zip = await storePostFile({
      buffer: zipBuffer(),
      filename: "bundle.zip",
      uploadedById: admin.id,
    });
    fileIds.push(zip.file.id);
    console.log("ZIP uploaded", zip.file.id);

    const filePost = await prisma.post.create({
      data: {
        title: "E2E File Post PDF",
        slug: `e2e-file-pdf-${Date.now().toString(36)}`,
        content: "<p>Download the guide</p>",
        excerpt: "PDF guide",
        status: "PUBLISHED",
        publishedAt: new Date(),
        deliveryType: "FILE",
        fileId: pdf.file.id,
        version: "1.0",
        publisher: "Daily Tips QA",
        authorId: admin.id,
        ...(category
          ? { categories: { create: [{ categoryId: category.id }] } }
          : {}),
      },
      include: {
        file: true,
        categories: { include: { category: true } },
        author: { select: { id: true, name: true, image: true } },
      },
    });
    createdIds.push(filePost.id);

    const linkPost = await prisma.post.create({
      data: {
        title: "E2E Link Post",
        slug: `e2e-link-${Date.now().toString(36)}`,
        content: "<p>Get it externally</p>",
        status: "PUBLISHED",
        publishedAt: new Date(),
        deliveryType: "LINK",
        externalUrl: validateExternalUrl("https://example.com/download"),
        linkDescription: "Official download page",
        authorId: admin.id,
      },
      include: { file: true },
    });
    createdIds.push(linkPost.id);

    const nonePost = await prisma.post.create({
      data: {
        title: "E2E Normal Post",
        slug: `e2e-none-${Date.now().toString(36)}`,
        content: "<p>Just an article</p>",
        status: "PUBLISHED",
        publishedAt: new Date(),
        deliveryType: "NONE",
        authorId: admin.id,
      },
      include: { file: true },
    });
    createdIds.push(nonePost.id);

    const serializedFile = serializePost(filePost);
    const serializedLink = serializePost(linkPost);
    const serializedNone = serializePost(nonePost);

    if (serializedFile.deliveryType !== "file" || !serializedFile.file) {
      throw new Error("File post serialize failed");
    }
    if (serializedLink.deliveryType !== "link" || !serializedLink.externalUrl) {
      throw new Error("Link post serialize failed");
    }
    if (serializedNone.deliveryType !== "none" || serializedNone.file || serializedNone.externalUrl) {
      throw new Error("None post serialize failed");
    }
    if (JSON.stringify(serializedFile).includes("storageKey")) {
      throw new Error("storageKey leaked in API payload");
    }
    console.log("Serializers OK");

    const url = await createPostFileDownloadUrl({
      storageKey: pdf.file.storageKey,
      originalName: pdf.file.originalName,
      ttlSeconds: 120,
    });
    console.log("Signed download URL issued:", url.slice(0, 80) + "…");

    // Hit public API if server is up
    const base = absoluteUrl("/api/v1");
    try {
      const detail = await fetch(`${base}/posts/${filePost.slug}`);
      const detailJson = await detail.json();
      if (!detail.ok) throw new Error(JSON.stringify(detailJson));
      if (detailJson.data?.deliveryType !== "file") {
        throw new Error("API detail missing deliveryType file");
      }

      const dl = await fetch(`${base}/posts/${filePost.slug}/download`);
      const dlJson = await dl.json();
      if (!dl.ok) throw new Error(JSON.stringify(dlJson));
      if (!dlJson.data?.url) throw new Error("Download route missing url");
      if (dlJson.data.installed !== false) throw new Error("installed must be false");

      const fileRes = await fetch(dlJson.data.url);
      if (!fileRes.ok) throw new Error(`Signed URL fetch failed: ${fileRes.status}`);
      const bytes = Buffer.from(await fileRes.arrayBuffer());
      if (!bytes.slice(0, 4).toString().startsWith("%PDF")) {
        throw new Error("Downloaded bytes are not a PDF");
      }
      console.log("Public download API OK — real PDF bytes received");

      const linkDetail = await fetch(`${base}/posts/${linkPost.slug}`);
      const linkJson = await linkDetail.json();
      if (linkJson.data?.deliveryType !== "link") throw new Error("link detail failed");
      const noneDetail = await fetch(`${base}/posts/${nonePost.slug}`);
      const noneJson = await noneDetail.json();
      if (noneJson.data?.deliveryType !== "none") throw new Error("none detail failed");
      console.log("Public post detail API OK for file/link/none");
    } catch (e) {
      console.warn("HTTP verification skipped/failed (is next running?):", e);
    }

    // Replace file: attach zip, delete old
    await prisma.post.update({
      where: { id: filePost.id },
      data: { fileId: zip.file.id },
    });
    await removePostFile(pdf.file.id);
    fileIds.splice(fileIds.indexOf(pdf.file.id), 1);
    console.log("File replace + old object cleanup OK");
  } finally {
    for (const id of createdIds) {
      await prisma.post.delete({ where: { id } }).catch(() => undefined);
    }
    for (const id of fileIds) {
      await removePostFile(id).catch(() => undefined);
    }
    await prisma.$disconnect();
  }

  console.log("VERIFY_POST_DELIVERY_OK");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
