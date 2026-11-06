-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "branding" JSONB,
ADD COLUMN     "homeSections" JSONB;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "tagline" TEXT NOT NULL DEFAULT 'Technology • Knowledge • Innovation',
ALTER COLUMN "platformName" SET DEFAULT 'Daily Tips';
