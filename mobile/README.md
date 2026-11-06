# Daily Tips (Flutter)

Android/iOS client for the Daily Tips platform. Consumes the Next.js `/api/v1` API only — no mock content.

## Stack

- Flutter + Riverpod + Dio + GoRouter
- Secure token storage, offline Hive cache, connectivity banner
- AdMob (test IDs in debug), FCM when Firebase is configured
- Premium via server-side Chapa/Telebirr verify (`POST /subscriptions/verify`) — no Play Billing for digital subscriptions in v1

## Configure API base URL

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

- Android emulator → host machine: `http://10.0.2.2:3000/api/v1`
- Physical device → your LAN IP: `http://192.168.x.x:3000/api/v1`
- iOS simulator → `http://127.0.0.1:3000/api/v1`

## Run

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

## Tests

```bash
flutter test
```

## Debug APK

```bash
flutter build apk --debug --dart-define=API_BASE_URL=https://your-api.example.com/api/v1
```

## Release signing (template)

1. Create a keystore (once):

```bash
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

2. Add `android/key.properties` (do not commit):

```properties
storePassword=...
keyPassword=...
keyAlias=upload
storeFile=../upload-keystore.jks
```

3. Wire `android/app/build.gradle.kts` signingConfigs to read `key.properties`.

4. Build AAB:

```bash
flutter build appbundle --release --dart-define=API_BASE_URL=https://your-api.example.com/api/v1 --dart-define=USE_ADMOB_TEST_IDS=false
```

## Android install flow

- Downloads store files under app documents; SHA-256 is verified when the API returns a checksum.
- **Install** opens the system package installer via `open_filex`. A completed download is never treated as installed.
- `REQUEST_INSTALL_PACKAGES` is declared for APK sideload; guide users to allow unknown sources only from trusted Daily Tips downloads.

## Firebase / FCM

Add `google-services.json` under `android/app/` and enable the Google Services Gradle plugin. Until configured, FCM init fails soft and the app continues without push.

## Brand

Official colors only: navy `#083687`, gold `#FFAE00`. Remote `/app/settings` may supply logo/name; HEX defaults stay official.
