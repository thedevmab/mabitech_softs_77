-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "announcementBody" TEXT,
ADD COLUMN     "announcementEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "announcementTitle" TEXT,
ADD COLUMN     "contentRefreshSeconds" INTEGER NOT NULL DEFAULT 300,
ADD COLUMN     "privacyPolicyUrl" TEXT,
ADD COLUMN     "recommendedAppVersion" TEXT NOT NULL DEFAULT '1.0.0',
ADD COLUMN     "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
ADD COLUMN     "termsOfServiceUrl" TEXT,
ADD COLUMN     "updateUrl" TEXT;
