# Daily Tips

Production-oriented Technology Content, Software Distribution, and Digital Resources platform built as a single Next.js application.

## Stack

- Next.js 16 (App Router) + TypeScript
- PostgreSQL + Prisma
- Auth.js (web sessions) + JWT access/refresh tokens (Flutter API)
- Redis rate limiting
- Local disk or S3-compatible object storage
- Cloudinary for images (optional)
- ClamAV malware scanning (optional in development)
- Tailwind CSS + shadcn-style UI
- Recharts analytics

## Features

- Public editorial website (light/dark)
- Admin dashboard with RBAC
- CMS for articles
- Software / APK distribution with verification workflow
- Versioned REST API under `/api/v1` for Flutter
- Ads, premium subscriptions (Chapa / Telebirr server-side verification), affiliates, sponsored campaigns
- FCM notification dispatch
- OpenAPI document at [`openapi/v1.json`](openapi/v1.json)

Publishing content or software never requires a Flutter app release. The mobile client reads `/api/v1` and remote app settings.

## Prerequisites

- Node.js 22+
- Docker (PostgreSQL + Redis)

## Quick start

```bash
# 1. Start infrastructure
docker compose up -d postgres redis

# 2. Configure environment
cp .env.example .env
# DATABASE_URL defaults to localhost:5436
# REDIS_URL defaults to localhost:6381
# STORAGE_DRIVER=local for development without MinIO

# 3. Install and prepare database
npm install
npx prisma migrate deploy
npm run db:seed

# 4. Run the app
npm run dev
```

Open:

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin
- API docs (admin): http://localhost:3000/admin/api-docs

Default super admin (from seed / `.env`):

- Email: `admin@example.com`
- Password: `ChangeMeImmediately1!`

Change these immediately in any non-local environment.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run db:migrate` | Create/apply migrations |
| `npm run db:seed` | Seed roles, categories, settings, admin |
| `npm run db:backup` | `pg_dump` into `./backups` |
| `npm test` | Vitest unit tests |

## Storage

- Development default: `STORAGE_DRIVER=local` writes to `./storage/files`
- Production: set `STORAGE_DRIVER=s3` and S3/MinIO credentials
- Downloads use short-lived grants; private object URLs are never exposed permanently
- Hosted APKs/binaries stay `PENDING_REVIEW` after upload/scan until an admin verifies them

## Payments

Premium is activated only after server-side verification:

- `POST /api/v1/subscriptions/verify`
- Webhooks: `/api/webhooks/chapa`, `/api/webhooks/telebirr`

If provider credentials are missing, verification fails closed and does not grant premium.

## Flutter remote config

`GET /api/v1/app/settings` returns maintenance mode, minimum version, feature flags, and ad policy so the app can adapt without a store release.

## Scheduled publishing

Call with the cron secret:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/publish-scheduled
```

## Production notes

- Set strong `AUTH_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `CRON_SECRET`
- `REDIS_URL` is required in production
- Configure SMTP for email verification / password reset
- Enable ClamAV (`CLAMAV_ENABLED=true`) when scanning binaries
- Use the provided `Dockerfile` (`prisma migrate deploy` then `next start`)
- Schedule `npm run db:backup` or host-managed PostgreSQL backups

## Security defaults

- Argon2id password hashing
- RBAC permissions for admin actions
- Zod validation on API inputs
- Rate limiting on auth and sensitive endpoints
- Sanitized rich text
- Security headers via `src/proxy.ts`
- Audit log for privileged actions
