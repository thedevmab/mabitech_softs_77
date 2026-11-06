import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../shared/providers/core_providers.dart';
import '../services/download_manager.dart';
import 'ad_configuration_service.dart';
import 'ad_error_reporter.dart';
import 'ad_unit_ids.dart';
import 'admob_service.dart';
import 'full_screen_ad_gate.dart';

class AppOpenAdManager {
  AppOpenAdManager(this._ref);

  final Ref _ref;
  AppOpenAd? _ad;
  bool _loading = false;
  DateTime? _lastShownAt;
  DateTime? _wentToBackgroundAt;

  static const _lastShownKey = 'admob_app_open_last_shown';

  SharedPreferences get _prefs => _ref.read(sharedPrefsProvider);

  bool get isReady => _ad != null;

  Future<void> preload() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    final ads = _ref.read(adsServiceProvider);
    final config = _ref.read(adConfigurationServiceProvider).config;
    if (!ads.canRequestAds || !config.adsEnabled || !config.appOpenEnabled) {
      return;
    }
    final unitId = AdUnitIds.appOpen;
    if (unitId.isEmpty || _loading || _ad != null) return;

    _loading = true;
    try {
      await AppOpenAd.load(
        adUnitId: unitId,
        request: const AdRequest(),
        adLoadCallback: AppOpenAdLoadCallback(
          onAdLoaded: (ad) {
            _ad = ad;
            _loading = false;
          },
          onAdFailedToLoad: (error) {
            _loading = false;
            _ad = null;
            // ignore: unawaited_futures
            _ref.read(adErrorReporterProvider).report(
                  format: 'app_open',
                  code: '${error.code}',
                  message: error.message,
                );
          },
        ),
      );
    } catch (e) {
      _loading = false;
      // ignore: unawaited_futures
      _ref.read(adErrorReporterProvider).report(
            format: 'app_open',
            message: e.toString(),
          );
    }
  }

  void onAppPaused() {
    _wentToBackgroundAt = DateTime.now();
  }

  bool _cooldownElapsed(int cooldownSeconds) {
    final last = _lastShownAt ??
        DateTime.tryParse(_prefs.getString(_lastShownKey) ?? '');
    if (last == null) return true;
    return DateTime.now().difference(last).inSeconds >= cooldownSeconds;
  }

  Future<bool> maybeShowColdStart() async {
    final config = _ref.read(adConfigurationServiceProvider).config;
    if (!config.appOpenEnabled || !config.adsEnabled) return false;
    if (_ad == null) return false;
    // Cold start: only if already loaded; do not wait.
    return _showInternal(requireBackgroundGap: false);
  }

  Future<bool> maybeShowOnResume() async {
    final config = _ref.read(adConfigurationServiceProvider).config;
    if (!config.appOpenEnabled || !config.adsEnabled) return false;
    final backgroundAt = _wentToBackgroundAt;
    if (backgroundAt == null) return false;
    // Ignore brief inactive/paused noise from route changes (< 1s).
    if (DateTime.now().difference(backgroundAt) < const Duration(seconds: 1)) {
      return false;
    }
    if (!_cooldownElapsed(config.appOpenCooldown)) return false;
    return _showInternal(requireBackgroundGap: true);
  }

  Future<bool> _showInternal({required bool requireBackgroundGap}) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      return false;
    }
    final ads = _ref.read(adsServiceProvider);
    if (!ads.canRequestAds) return false;

    final downloads = _ref.read(downloadManagerProvider.notifier);
    if (downloads.blocksFullscreenAds) return false;
    if (FullScreenAdGate.instance.isShowing) return false;
    if (_ad == null) {
      await preload();
      return false;
    }
    if (!FullScreenAdGate.instance.tryAcquire()) return false;

    final ad = _ad!;
    _ad = null;
    _wentToBackgroundAt = null;

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        FullScreenAdGate.instance.release();
        // ignore: unawaited_futures
        preload();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        FullScreenAdGate.instance.release();
        // ignore: unawaited_futures
        _ref.read(adErrorReporterProvider).report(
              format: 'app_open',
              code: '${error.code}',
              message: error.message,
            );
        // ignore: unawaited_futures
        preload();
      },
    );

    try {
      await ad.show();
      _lastShownAt = DateTime.now();
      await _prefs.setString(
        _lastShownKey,
        _lastShownAt!.toIso8601String(),
      );
      return true;
    } catch (e) {
      FullScreenAdGate.instance.release();
      ad.dispose();
      // ignore: unawaited_futures
      preload();
      return false;
    }
  }

  void disposeAd() {
    _ad?.dispose();
    _ad = null;
  }
}

final appOpenAdManagerProvider = Provider((ref) {
  final manager = AppOpenAdManager(ref);
  ref.onDispose(manager.disposeAd);
  return manager;
});
