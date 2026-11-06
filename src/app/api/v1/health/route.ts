import { prisma } from "@/lib/db";
import { jsonOk, handleApiError } from "@/lib/api";
import { isFcmConfigured } from "@/lib/notifications/fcm";
import { useLocalStorage } from "@/lib/storage/local";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    let database: "ok" | "error" = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "error";
    }

    const storageDriver = process.env.STORAGE_DRIVER || (useLocalStorage() ? "local" : "s3");
    const s3Configured = Boolean(
      process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.S3_BUCKET,
    );
    const cloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY,
    );

    const fcmConfigured = isFcmConfigured();
    const payments = {
      chapaConfigured: Boolean(process.env.CHAPA_SECRET_KEY),
      telebirrConfigured: Boolean(process.env.TELEBIRR_APP_ID),
    };

    const latencyMs = Date.now() - started;
    const status =
      database === "ok" ? "healthy" : "degraded";

    return jsonOk(
      {
        status,
        checkedAt: new Date().toISOString(),
        latencyMs,
        services: {
          database: { status: database, verified: database === "ok" },
          storage: {
            driver: storageDriver,
            configured:
              storageDriver === "local" || s3Configured || cloudinaryConfigured,
            verified: false,
            note: "Configured means credentials/driver present; object I/O is not probed on every health check.",
          },
          firebaseMessaging: {
            configured: fcmConfigured,
            verified: false,
            note: fcmConfigured
              ? "Service account present; delivery is not claimed by this check."
              : "FIREBASE_SERVICE_ACCOUNT not set.",
          },
          payments: {
            configured: payments.chapaConfigured || payments.telebirrConfigured,
            providers: payments,
            verified: false,
          },
          email: {
            configured: Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY),
            verified: false,
          },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
