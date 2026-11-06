import '../config/env.dart';

/// Centralized AdMob identifiers. Never scatter unit IDs across widgets.
///
/// Debug builds keep Google test IDs while [Env.useAdMobTestIds] is true
/// (default). Production IDs below are Daily Tips AdMob units; override with
/// `--dart-define` when needed.
abstract final class AdUnitIds {
  static const _testAppId = 'ca-app-pub-3940256099942544~3347511713';
  static const _testBanner = 'ca-app-pub-3940256099942544/6300978111';
  static const _testInterstitial = 'ca-app-pub-3940256099942544/1033173712';
  static const _testNative = 'ca-app-pub-3940256099942544/2247696110';
  static const _testAppOpen = 'ca-app-pub-3940256099942544/9257395921';

  /// Production Daily Tips app + units (publisher 2620359636152769).
  static const _prodAppIdDefault =
      'ca-app-pub-2620359636152769~2499347779';
  static const _prodBannerDefault =
      'ca-app-pub-2620359636152769/5341133534';
  static const _prodNativeDefault =
      'ca-app-pub-2620359636152769/6271071820';
  static const _prodInterstitialDefault =
      'ca-app-pub-2620359636152769/8984865071';
  static const _prodAppOpenDefault =
      'ca-app-pub-2620359636152769/3665089783';
  /// Rewarded unit exists in AdMob but is unused (no rewarded flow in app):
  /// ca-app-pub-2620359636152769/6455913815

  static const _prodAppId = String.fromEnvironment(
    'ADMOB_APP_ID',
    defaultValue: _prodAppIdDefault,
  );
  static const _prodBanner = String.fromEnvironment(
    'ADMOB_BANNER_UNIT_ID',
    defaultValue: _prodBannerDefault,
  );
  static const _prodInterstitial = String.fromEnvironment(
    'ADMOB_INTERSTITIAL_UNIT_ID',
    defaultValue: _prodInterstitialDefault,
  );
  static const _prodNative = String.fromEnvironment(
    'ADMOB_NATIVE_UNIT_ID',
    defaultValue: _prodNativeDefault,
  );
  static const _prodAppOpen = String.fromEnvironment(
    'ADMOB_APP_OPEN_UNIT_ID',
    defaultValue: _prodAppOpenDefault,
  );

  static const testDeviceId = String.fromEnvironment('ADMOB_TEST_DEVICE_ID');

  static bool get useTestIds => Env.useAdMobTestIds;

  static String get appId => useTestIds ? _testAppId : _prodAppId;

  static String get banner => useTestIds ? _testBanner : _prodBanner;

  static String get interstitial =>
      useTestIds ? _testInterstitial : _prodInterstitial;

  static String get native => useTestIds ? _testNative : _prodNative;

  static String get appOpen => useTestIds ? _testAppOpen : _prodAppOpen;
}
