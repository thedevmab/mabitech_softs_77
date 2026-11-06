-- CreateEnum
CREATE TYPE "PostDeliveryType" AS ENUM ('NONE', 'FILE', 'LINK');

-- CreateTable
CREATE TABLE "post_files" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageBucket" TEXT NOT NULL,
    "scanResult" TEXT,
    "scannedAt" TIMESTAMP(3),
    "apkPackage" TEXT,
    "apkVersionName" TEXT,
    "apkVersionCode" INTEGER,
    "apkMinSdk" INTEGER,
    "uploadedById" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_files_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "deliveryType" "PostDeliveryType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "posts" ADD COLUMN "externalUrl" TEXT;
ALTER TABLE "posts" ADD COLUMN "linkDescription" TEXT;
ALTER TABLE "posts" ADD COLUMN "version" TEXT;
ALTER TABLE "posts" ADD COLUMN "publisher" TEXT;
ALTER TABLE "posts" ADD COLUMN "releaseDate" TIMESTAMP(3);
ALTER TABLE "posts" ADD COLUMN "fileId" TEXT;

-- CreateIndex
CREATE INDEX "post_files_checksumSha256_idx" ON "post_files"("checksumSha256");

-- CreateIndex
CREATE INDEX "post_files_extension_idx" ON "post_files"("extension");

-- CreateIndex
CREATE UNIQUE INDEX "posts_fileId_key" ON "posts"("fileId");

-- CreateIndex
CREATE INDEX "posts_deliveryType_idx" ON "posts"("deliveryType");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "post_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Delivery type consistency: LINK requires externalUrl; FILE requires fileId
ALTER TABLE "posts" ADD CONSTRAINT "posts_delivery_type_check" CHECK (
  ("deliveryType" = 'NONE')
  OR ("deliveryType" = 'LINK' AND "externalUrl" IS NOT NULL AND "externalUrl" <> '')
  OR ("deliveryType" = 'FILE' AND "fileId" IS NOT NULL)
);
