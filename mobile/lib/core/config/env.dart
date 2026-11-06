class Env {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://mabitechsofts77.vercel.app/api/v1',
  );

  static const useAdMobTestIds = bool.fromEnvironment(
    'USE_ADMOB_TEST_IDS',
    defaultValue: true,
  );

  /// Must match pubspec version for force-update checks unless overridden.
  static const appVersion = String.fromEnvironment(
    'APP_VERSION',
    defaultValue: '1.0.0',
  );
}
