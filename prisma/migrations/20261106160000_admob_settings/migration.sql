-- CreateEnum
CREATE TYPE "AdMobPlatform" AS ENUM ('android');

-- CreateEnum
CREATE TYPE "AdMobEnvironment" AS ENUM ('development', 'production');

-- CreateTable
CREATE TABLE "admob_settings" (
    "id" TEXT NOT NULL,
    "platform" "AdMobPlatform" NOT NULL DEFAULT 'android',
    "environment" "AdMobEnvironment" NOT NULL,
    "appId" TEXT,
    "bannerAdUnitId" TEXT,
    "interstitialAdUnitId" TEXT,
    "nativeAdUnitId" TEXT,
    "appOpenAdUnitId" TEXT,
    "bannerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "interstitialEnabled" BOOLEAN NOT NULL DEFAULT false,
    "nativeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "appOpenEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bannerOnHome" BOOLEAN NOT NULL DEFAULT true,
    "bannerOnExplore" BOOLEAN NOT NULL DEFAULT true,
    "bannerOnArticle" BOOLEAN NOT NULL DEFAULT true,
    "nativeOnHome" BOOLEAN NOT NULL DEFAULT true,
    "nativeOnExplore" BOOLEAN NOT NULL DEFAULT true,
    "interstitialCooldown" INTEGER NOT NULL DEFAULT 300,
    "interstitialSessionLimit" INTEGER NOT NULL DEFAULT 5,
    "nativeAdFrequency" INTEGER NOT NULL DEFAULT 5,
    "appOpenCooldown" INTEGER NOT NULL DEFAULT 14400,
    "childDirected" BOOLEAN NOT NULL DEFAULT false,
    "consentRequired" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admob_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admob_client_errors" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "code" TEXT,
    "message" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admob_client_errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admob_settings_platform_environment_key" ON "admob_settings"("platform", "environment");

-- CreateIndex
CREATE INDEX "admob_client_errors_createdAt_idx" ON "admob_client_errors"("createdAt");
