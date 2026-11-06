# Daily Tips — Deployment

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Flutter 3.24+ (for mobile builds)
- Optional: Redis (rate limits), S3-compatible storage, Firebase service account JSON, SMTP/Resend, Chapa/Telebirr keys

## Environment

Copy [`.env.example`](../.env.example) to `.env` and set real values. Never commit `.env`, private keys, or uploaded binaries.

Important groups:

- `DATABASE_URL`, `AUTH_SECRET` / NextAuth secrets, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `NEXTAUTH_URL` / public site URL (used by admin health checks)
- `STORAGE_DRIVER`, `S3_*` or local storage paths, `CLOUDINARY_*`
- `FIREBASE_SERVICE_ACCOUNT` (JSON string for FCM HTTP v1)
- `CHAPA_*`, `TELEBIRR_*` (premium verification)
- Email provider vars for OTP / password reset delivery

## Database

```bash
npx prisma migrate deploy
npx prisma db seed
```

Rollback: restore a DB backup taken before `migrate deploy`, then redeploy the previous app revision. Prefer forward-fix migrations for production.

## Web / API

```bash
npm ci
npm run build
npm run start
```

Use HTTPS in production. Restrict CORS to known web origins. Keep upload size limits (`MAX_UPLOAD_BYTES`) and rate limiting enabled.

## Flutter

```bash
cd mobile
flutter pub get
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://your-domain.com/api/v1 \
  --dart-define=USE_ADMOB_TEST_IDS=false \
  --dart-define=APP_VERSION=1.0.0
```

Add `android/app/google-services.json` before relying on FCM. See [`mobile/README.md`](../mobile/README.md) for signing.

## Backups

- Nightly PostgreSQL dumps (retain ≥ 7 days)
- Object-storage versioning for APKs/media
- Document restore drill quarterly

## Health

`GET /api/v1/health` returns safe operational status (DB ping, whether integrations are **configured**). Admin UI: `/admin/health`.
