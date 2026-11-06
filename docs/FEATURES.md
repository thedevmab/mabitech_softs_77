# Daily Tips — Features & configuration checklist

## Completed (real DB / API — no mock production content)

### Admin (Next.js server actions + RBAC)
- Overview with live stats (users, articles, software, downloads, premium, awaiting review, notifications, open reports)
- Articles / Technology Tips / AI News (filtered posts)
- AI Tools / Software Downloads (filtered software)
- Categories, Homepage Manager, Users, Premium subscriptions
- Notifications (FCM composer), Ads, Sponsored, Affiliates, Analytics
- Reports moderation, App Settings (remote config), Audit Logs
- API & Integration Health, API Docs (OpenAPI)

### Public API `/api/v1`
- Auth (register/login/refresh/logout/forgot/reset/verify-otp)
- Home sections, posts/articles, software/downloads/ai-tools
- Bookmarks, favorites, comments, views, analytics events
- App settings/config/version, ads & monetization config
- Device register/delete, notifications inbox
- Signed software downloads + checksum metadata + complete (never claims installed)
- Health endpoint

### Flutter (`mobile/`)
- Home (remote sections + announcement), Explore, Articles, Software, Downloads
- Auth, Saved, Profile, Premium verify (Chapa/Telebirr server-side)
- Force-update gate, AdMob slot (premium-aware), FCM soft-init
- Offline cache with account-scoped clear on logout
- GET download + SHA-256 verify + `/downloads/complete`

## Requires external credentials (not shippable in-repo)

| Service | Env / asset | Used for |
|---------|-------------|----------|
| PostgreSQL | `DATABASE_URL` | All data |
| Firebase | `FIREBASE_SERVICE_ACCOUNT`, `google-services.json` | Push |
| Object storage | `S3_*` or local + Cloudinary | APKs/media |
| Payments | `CHAPA_*`, `TELEBIRR_*` | Premium verify |
| Email | SMTP / Resend | OTP & resets |
| AdMob | App/unit IDs in admin + Flutter | Ads |

## Explicit non-claims
- Health “configured” ≠ end-to-end verified send/pay/storage I/O (except DB ping).
- FCM submission ≠ delivered/opened unless measured.
- Download complete ≠ installed.
