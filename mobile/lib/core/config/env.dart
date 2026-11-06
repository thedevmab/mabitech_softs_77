class Env {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
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
