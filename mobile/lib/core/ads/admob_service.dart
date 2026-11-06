import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'ad_configuration_service.dart';
import 'ad_unit_ids.dart';
import 'app_open_ad_manager.dart';
import 'interstitial_ad_manager.dart';

class AdMobService {
  AdMobService(this._ref);

  final Ref _ref;
  bool _initialized = false;
  bool _privacyOptionsRequired = false;
  bool _canRequestAds = false;
  DateTime? _sessionStartedAt;

  bool get isInitialized => _initialized;
  bool get privacyOptionsRequired => _privacyOptionsRequired;
  bool get canRequestAds => _canRequestAds;
  DateTime? get sessionStartedAt => _sessionStartedAt;

  bool get isSupportedPlatform =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  Future<void> init({required bool isPremium}) async {
    if (!isSupportedPlatform) {
      _initialized = true;
      return;
    }

    final configService = _ref.read(adConfigurationServiceProvider);
    await configService.load(isPremium: isPremium);
    final config = configService.config;

    if (isPremium || !config.adsEnabled) {
      _initialized = true;
      _canRequestAds = false;
      _sessionStartedAt = DateTime.now();
      return;
    }

    try {
      if (config.consentRequired) {
        final completer = Completer<void>();
        ConsentInformation.instance.requestConsentInfoUpdate(
          ConsentRequestParameters(),
          () async {
            await ConsentForm.loadAndShowConsentFormIfRequired((_) {});
            if (!completer.isCompleted) completer.complete();
          },
          (error) {
            if (!completer.isCompleted) completer.complete();
          },
        );
        await completer.future.timeout(
          const Duration(seconds: 8),
          onTimeout: () {},
        );
      }

      _canRequestAds = await ConsentInformation.instance.canRequestAds();
      if (config.consentRequired && !_canRequestAds) {
        _initialized = true;
        _sessionStartedAt = DateTime.now();
        final status = await ConsentInformation.instance
            .getPrivacyOptionsRequirementStatus();
        _privacyOptionsRequired =
            status == PrivacyOptionsRequirementStatus.required;
        return;
      }

      final status = await ConsentInformation.instance
          .getPrivacyOptionsRequirementStatus();
      _privacyOptionsRequired =
          status == PrivacyOptionsRequirementStatus.required;

      await MobileAds.instance.updateRequestConfiguration(
        RequestConfiguration(
          maxAdContentRating: config.childDirected
              ? MaxAdContentRating.g
              : MaxAdContentRating.t,
          ageRestrictedTreatment: config.childDirected
              ? AgeRestrictedTreatment.child
              : AgeRestrictedTreatment.unspecified,
          testDeviceIds: AdUnitIds.testDeviceId.isEmpty
              ? null
              : [AdUnitIds.testDeviceId],
        ),
      );

      await MobileAds.instance.initialize();
      _initialized = true;
      _canRequestAds = true;
      _sessionStartedAt = DateTime.now();

      if (config.interstitialEnabled) {
        // ignore: unawaited_futures
        _ref.read(interstitialAdManagerProvider).preload();
      }
      if (config.appOpenEnabled) {
        // ignore: unawaited_futures
        _ref.read(appOpenAdManagerProvider).preload();
      }
    } catch (_) {
      _initialized = true;
      _canRequestAds = false;
      _sessionStartedAt = DateTime.now();
    }
  }

  Future<void> showPrivacyOptions() async {
    if (!isSupportedPlatform) return;
    await ConsentForm.showPrivacyOptionsForm((_) {});
  }

  bool get withinStartupGrace {
    final started = _sessionStartedAt;
    if (started == null) return true;
    return DateTime.now().difference(started) < const Duration(seconds: 60);
  }
}

final adsServiceProvider = Provider((ref) => AdMobService(ref));

/// Backward-compatible alias used by older imports.
typedef AdsService = AdMobService;
