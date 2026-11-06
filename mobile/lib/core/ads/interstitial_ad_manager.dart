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

class InterstitialAdManager {
  InterstitialAdManager(this._ref);

  final Ref _ref;
  InterstitialAd? _ad;
  bool _loading = false;
  int _sessionImpressions = 0;
  DateTime? _lastShownAt;

  static const _lastShownKey = 'admob_interstitial_last_shown';

  SharedPreferences get _prefs => _ref.read(sharedPrefsProvider);

  Future<void> preload() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    final ads = _ref.read(adsServiceProvider);
    final config = _ref.read(adConfigurationServiceProvider).config;
    if (!ads.canRequestAds ||
        !config.adsEnabled ||
        !config.interstitialEnabled) {
      return;
    }
    final unitId = AdUnitIds.interstitial;
    if (unitId.isEmpty || _loading || _ad != null) return;

    _loading = true;
    try {
      await InterstitialAd.load(
        adUnitId: unitId,
        request: const AdRequest(),
        adLoadCallback: InterstitialAdLoadCallback(
          onAdLoaded: (ad) {
            _ad = ad;
            _loading = false;
          },
          onAdFailedToLoad: (error) {
            _loading = false;
            _ad = null;
            // ignore: unawaited_futures
            _ref.read(adErrorReporterProvider).report(
                  format: 'interstitial',
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
            format: 'interstitial',
            message: e.toString(),
          );
    }
  }

  bool _frequencyAllows(int cooldownSeconds, int sessionLimit) {
    if (_sessionImpressions >= sessionLimit) return false;
    final last = _lastShownAt ??
        DateTime.tryParse(_prefs.getString(_lastShownKey) ?? '');
    if (last != null) {
      final elapsed = DateTime.now().difference(last).inSeconds;
      if (elapsed < cooldownSeconds) return false;
    }
    return true;
  }

  Future<bool> maybeShow({required String reason}) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      return false;
    }
    final ads = _ref.read(adsServiceProvider);
    final config = _ref.read(adConfigurationServiceProvider).config;
    if (!ads.canRequestAds ||
        !config.adsEnabled ||
        !config.interstitialEnabled) {
      return false;
    }
    if (ads.withinStartupGrace) return false;
    if (!_frequencyAllows(
      config.interstitialCooldown,
      config.interstitialSessionLimit,
    )) {
      return false;
    }

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
              format: 'interstitial',
              code: '${error.code}',
              message: error.message,
            );
        // ignore: unawaited_futures
        preload();
      },
    );

    try {
      await ad.show();
      _sessionImpressions += 1;
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
      _ref.read(adErrorReporterProvider).report(
            format: 'interstitial',
            message: e.toString(),
          );
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

final interstitialAdManagerProvider = Provider((ref) {
  final manager = InterstitialAdManager(ref);
  ref.onDispose(manager.disposeAd);
  return manager;
});
